import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import TeethMap from '../components/TeethMap';
import CalendarSwitcher from '../components/CalendarSwitcher';
import { clinicPatientsApi } from '../services/clinicPatientsApi';
import type { ClinicPatient, DoctorStats } from '../services/clinicPatientsApi';
// Интерфейс прямо в компоненте
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









interface TreatmentPlan {
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
  diagnosis: string;
  treatment_description: string;
  created_at: string;
  status: string;
  services: number[]; // ID выбранных услуг
  total_cost: number; // Общая стоимость плана
  selected_teeth: number[]; // ID выбранных зубов
  teethServices?: Record<number, number[]>; // Услуги для каждого зуба: {зуб: [услуги]}
  teeth_services?: Record<number, number[]>; // Альтернативное поле от API
  // Новое поле для хранения данных о зубах и услугах в новом формате
  toothServicesData?: Array<{
    toothId: number;
    services: Array<{
      id: number;
      name: string;
      price: number;
      category: string;
    }>;
  }>;
}

interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  duration: string;
  complexity: string;
  is_active: boolean;
}

const Doctor: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [clinicPatients, setClinicPatients] = useState<ClinicPatient[]>([]);
  const [doctorsStats, setDoctorsStats] = useState<DoctorStats[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null);
  const searchTimeoutRef = useRef<number | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchValueRef = useRef<string>('');

  const [treatmentPlans, setTreatmentPlans] = useState<TreatmentPlan[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'patients' | 'treatment-plans' | 'services' | 'calendar'>('patients');
  
  // Модальные окна
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showTreatmentPlanModal, setShowTreatmentPlanModal] = useState(false);

  
  // Данные для форм
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [editingTreatmentPlan, setEditingTreatmentPlan] = useState<TreatmentPlan | null>(null);

  const [isCreatingPatient, setIsCreatingPatient] = useState(false);
  const [isCreatingTreatmentPlan, setIsCreatingTreatmentPlan] = useState(false);

  
  // Состояние для сворачивания анамнеза в модалке плана лечения
  const [isAnamnesisCollapsed, setIsAnamnesisCollapsed] = useState(true);
  
  // Состояние для управления услугами на зубах
  const [teethServices, setTeethServices] = useState<Record<number, number[]>>({});
  
  useEffect(() => {
    fetchData();
  }, []);

  // Обработка параметра tab из URL
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['patients', 'treatment-plans', 'services', 'calendar'].includes(tabParam)) {
      setActiveTab(tabParam as 'patients' | 'treatment-plans' | 'services' | 'calendar');
    }
  }, [searchParams]);

  // Функция для безопасного получения массива услуг из плана
  const getPlanServices = (plan: TreatmentPlan) => {
    console.log('🔍 getPlanServices для плана', plan.id, ':', plan.services);
    return plan.services || [];
  };

  // Функция для безопасного получения стоимости плана
  const getPlanTotalCost = (plan: TreatmentPlan) => {
    console.log('💰 getPlanTotalCost для плана', plan.id, ':', plan.total_cost);
    return plan.total_cost || 0;
  };

  // Функция для безопасного получения выбранных зубов из плана
  const getPlanSelectedTeeth = (plan: TreatmentPlan) => {
    console.log('🦷 getPlanSelectedTeeth для плана', plan.id, ':', plan.selected_teeth);
    
    // Если есть selected_teeth, используем их
    if (plan.selected_teeth && plan.selected_teeth.length > 0) {
      return plan.selected_teeth;
    }
    
    // Иначе извлекаем зубы из teeth_services или teethServices
    const teethServices = plan.teeth_services || plan.teethServices || {};
    const teeth = Object.keys(teethServices).map(Number);
    console.log('🦷 Извлечены зубы из teeth_services:', teeth);
    return teeth;
  };

  const fetchData = async () => {
    try {
      // Загружаем статистику врачей
      console.log('🔄 Загружаем статистику врачей...');
      try {
        const doctorsStatsData = await clinicPatientsApi.getDoctorsStats();
        setDoctorsStats(doctorsStatsData);
        console.log('✅ Статистика врачей загружена:', doctorsStatsData);
      } catch (error) {
        console.error('❌ Ошибка загрузки статистики врачей:', error);
        setDoctorsStats([]);
      }

      // Загружаем пациентов клиники из БД
      console.log('🔄 Загружаем пациентов клиники из БД...');
      try {
        const clinicPatientsData = await clinicPatientsApi.getClinicPatients(1, 100);
        setClinicPatients(clinicPatientsData);
        console.log('✅ Пациенты клиники загружены из БД:', clinicPatientsData);
      } catch (error) {
        console.error('❌ Ошибка загрузки пациентов клиники:', error);
        setClinicPatients([]);
      }
      
      // Загружаем всех пациентов из БД (через общий api, same-host) с пагинацией
      console.log('🔄 Загружаем всех пациентов из БД...');
      const { data: patientsData } = await api.get('/patients/', { params: { page: 1, size: 200 } });
      if (patientsData && patientsData.patients) {
        setPatients(patientsData.patients);
        console.log('✅ Все пациенты загружены из БД:', patientsData.patients);
      } else {
        console.error('❌ Ошибка загрузки всех пациентов из БД, используем тестовые данные');
        // Fallback на тестовые данные если БД недоступна
        const testPatients = [
          {
            id: 1,
            full_name: 'Иванов Иван Иванович',
            phone: '+7 (777) 123-45-67',
            iin: '030317123456',
            birth_date: '2003-03-17',
            allergies: 'Аллергия на пенициллин, лидокаин',
            chronic_diseases: 'Сахарный диабет 2 типа',
            contraindications: 'Не рекомендуется лечение под общим наркозом',
            special_notes: 'Пациентка беременна, 3-й триместр',
            created_at: '2024-01-15'
          },
          {
            id: 2,
            full_name: 'Петрова Анна Сергеевна',
            phone: '+7 (777) 987-65-43',
            iin: '950512789012',
            birth_date: '1995-05-12',
            allergies: 'Нет аллергий',
            chronic_diseases: 'Гипертония',
            contraindications: 'Ограничения по физической нагрузке',
            special_notes: 'Пациентка принимает антикоагулянты',
            created_at: '2024-01-16'
          }
        ];
        setPatients(testPatients);
      }
      
      const testTreatmentPlans = [
        {
          id: 1,
          patient_id: 1,
          patient_name: 'Иванов Иван Иванович',
          diagnosis: 'Кариес зуба 2.6',
          treatment_description: 'Лечение кариеса с установкой пломбы',
          created_at: '2024-01-10',
          status: 'active',
          services: [2, 3], // Лечение кариеса + Установка пломбы
          total_cost: 23000,
          selected_teeth: [26], // Зуб 26 (2.6)
          teethServices: {
            26: [2, 3], // Зуб 26: лечение кариеса + установка пломбы
            15: [] // Пустой массив для зуба 15
          },
          toothServicesData: [
            {
              toothId: 26,
              services: [
                { id: 2, name: 'Лечение кариеса', price: 15000, category: 'therapy' },
                { id: 3, name: 'Установка пломбы', price: 8000, category: 'therapy' }
              ]
            }
          ]
        },
        {
          id: 2,
          patient_id: 2,
          patient_name: 'Петрова Анна Сергеевна',
          diagnosis: 'Пульпит зуба 1.5',
          treatment_description: 'Лечение пульпита с последующим протезированием',
          created_at: '2024-01-12',
          status: 'completed',
          services: [1, 2, 3], // Консультация + Лечение + Пломба
          total_cost: 28000,
          selected_teeth: [15], // Зуб 15 (1.5)
          teethServices: {
            26: [], // Пустой массив для зуба 26
            15: [1, 2, 3] // Зуб 15: консультация + лечение + пломба
          },
          toothServicesData: [
            {
              toothId: 15,
              services: [
                { id: 1, name: 'Консультация стоматолога', price: 5000, category: 'therapy' },
                { id: 2, name: 'Лечение кариеса', price: 15000, category: 'therapy' },
                { id: 3, name: 'Установка пломбы', price: 8000, category: 'therapy' }
              ]
            }
          ]
        }
      ];

      const testServices = [
        {
          id: 1,
          name: 'Консультация стоматолога',
          description: 'Первичный осмотр и консультация',
          price: 5000,
          category: 'therapy',
          duration: '30 минут',
          complexity: 'low',
          is_active: true
        },
        {
          id: 2,
          name: 'Лечение кариеса',
          description: 'Лечение кариеса с установкой пломбы',
          price: 15000,
          category: 'therapy',
          duration: '45 минут',
          complexity: 'medium',
          is_active: true
        },
        {
          id: 3,
          name: 'Установка пломбы',
          description: 'Установка световой пломбы',
          price: 8000,
          category: 'therapy',
          duration: '30 минут',
          complexity: 'medium',
          is_active: true
        },
        {
          id: 4,
          name: 'Удаление зуба',
          description: 'Простое удаление зуба',
          price: 12000,
          category: 'surgery',
          duration: '20 минут',
          complexity: 'high',
          is_active: true
        }
      ];

      // setAppointments(testAppointments);
      
      // Загружаем планы лечения из БД
      console.log('🔄 Загружаем планы лечения из БД...');
      try {
        const { data: treatmentPlansData } = await api.get('/treatment-plans/');
        if (treatmentPlansData && Array.isArray(treatmentPlansData)) {
          setTreatmentPlans(treatmentPlansData);
          console.log('✅ Планы лечения загружены из БД:', treatmentPlansData);
          // Отладочная информация для каждого плана
          treatmentPlansData.forEach((plan, index) => {
            console.log(`📋 План ${index + 1}:`, {
              id: plan.id,
              services: plan.services,
              selected_teeth: plan.selected_teeth,
              teeth_services: plan.teeth_services,
              total_cost: plan.total_cost
            });
          });
        } else {
          throw new Error('Неверный формат данных планов лечения');
        }
      } catch (error) {
        console.error('❌ Ошибка загрузки планов лечения из БД, используем тестовые данные:', error);
        // Fallback на тестовые данные если БД недоступна
        const testPlansWithDefaults = testTreatmentPlans.map(plan => ({
          ...plan,
          patient_phone: '',
          patient_iin: '',
          patient_birth_date: '',
          patient_allergies: '',
          patient_chronic_diseases: '',
          patient_contraindications: '',
          patient_special_notes: '',
          teethServices: plan.teethServices || {}, // Добавляем teethServices если их нет
          toothServicesData: plan.toothServicesData || [] // Добавляем toothServicesData если их нет
        }));
        setTreatmentPlans(testPlansWithDefaults);
      }
      
      // Загружаем услуги из БД
      console.log('🔄 Загружаем услуги из БД...');
      try {
        const { data: servicesData } = await api.get('/services/');
        if (servicesData && Array.isArray(servicesData)) {
          // Добавляем поле category для совместимости с TeethMap
          const servicesWithCategory = servicesData.map(service => ({
            ...service,
            category: 'therapy' // Временное решение, можно добавить категории в БД
          }));
          setServices(servicesWithCategory);
          console.log('✅ Услуги загружены из БД:', servicesWithCategory);
        } else {
          throw new Error('Неверный формат данных услуг');
        }
      } catch (error) {
        console.error('❌ Ошибка загрузки услуг из БД, используем тестовые данные:', error);
        setServices(testServices);
      }
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      // Устанавливаем тестовые данные в случае ошибки
      const testPatients = [
        {
          id: 1,
          full_name: 'Иванов Иван Иванович',
          phone: '+7 (777) 123-45-67',
          iin: '030317123456',
          birth_date: '2003-03-17',
          allergies: 'Аллергия на пенициллин, лидокаин',
          chronic_diseases: 'Сахарный диабет 2 типа',
          contraindications: 'Не рекомендуется лечение под общим наркозом',
          special_notes: 'Пациентка беременна, 3-й триместр',
          created_at: '2024-01-15'
        },
        {
          id: 2,
          full_name: 'Петрова Анна Сергеевна',
          phone: '+7 (777) 987-65-43',
          iin: '950512789012',
          birth_date: '1995-05-12',
          allergies: 'Нет аллергий',
          chronic_diseases: 'Гипертония',
          contraindications: 'Ограничения по физической нагрузке',
          special_notes: 'Пациентка принимает антикоагулянты',
          created_at: '2024-01-16'
        }
      ];
      
      const testTreatmentPlans = [
        {
          id: 1,
          patient_id: 1,
          patient_name: 'Иванов Иван Иванович',
          diagnosis: 'Кариес зуба 2.6',
          treatment_description: 'Лечение кариеса с установкой пломбы',
          created_at: '2024-01-10',
          status: 'active',
          services: [2, 3], // Лечение кариеса + Установка пломбы
          total_cost: 23000,
          selected_teeth: [26], // Зуб 26 (2.6)
          teethServices: {
            26: [2, 3], // Зуб 26: лечение кариеса + установка пломбы
            15: [] // Пустой массив для зуба 15
          },
          toothServicesData: [
            {
              toothId: 26,
              services: [
                { id: 2, name: 'Лечение кариеса', price: 15000, category: 'therapy' },
                { id: 3, name: 'Установка пломбы', price: 8000, category: 'therapy' }
              ]
            }
          ]
        },
        {
          id: 2,
          patient_id: 2,
          patient_name: 'Петрова Анна Сергеевна',
          diagnosis: 'Пульпит зуба 1.5',
          treatment_description: 'Лечение пульпита с последующим протезированием',
          created_at: '2024-01-12',
          status: 'completed',
          services: [1, 2, 3], // Консультация + Лечение + Пломба
          total_cost: 28000,
          selected_teeth: [15], // Зуб 15 (1.5)
          teethServices: {
            26: [], // Пустой массив для зуба 26
            15: [1, 2, 3] // Зуб 15: консультация + лечение + пломба
          },
          toothServicesData: [
            {
              toothId: 15,
              services: [
                { id: 1, name: 'Консультация стоматолога', price: 5000, category: 'therapy' },
                { id: 2, name: 'Лечение кариеса', price: 15000, category: 'therapy' },
                { id: 3, name: 'Установка пломбы', price: 8000, category: 'therapy' }
              ]
            }
          ]
        }
      ];

      const testServices = [
        {
          id: 1,
          name: 'Консультация стоматолога',
          description: 'Первичный осмотр и консультация',
          price: 5000,
          category: 'therapy',
          duration: '30 минут',
          complexity: 'low',
          is_active: true
        },
        {
          id: 2,
          name: 'Лечение кариеса',
          description: 'Лечение кариеса с установкой пломбы',
          price: 15000,
          category: 'therapy',
          duration: '45 минут',
          complexity: 'medium',
          is_active: true
        },
        {
          id: 3,
          name: 'Установка пломбы',
          description: 'Установка световой пломбы',
          price: 8000,
          category: 'therapy',
          duration: '30 минут',
          complexity: 'medium',
          is_active: true
        },
        {
          id: 4,
          name: 'Удаление зуба',
          description: 'Простое удаление зуба',
          price: 12000,
          category: 'surgery',
          duration: '20 минут',
          complexity: 'high',
          is_active: true
        }
      ];

      setPatients(testPatients);
      // setAppointments(testAppointments);
      
      // Загружаем планы лечения из БД
      console.log('🔄 Загружаем планы лечения из БД (fallback)...');
      try {
        const { data: treatmentPlansData } = await api.get('/treatment-plans/');
        if (treatmentPlansData && Array.isArray(treatmentPlansData)) {
          setTreatmentPlans(treatmentPlansData);
          console.log('✅ Планы лечения загружены из БД (fallback):', treatmentPlansData);
          // Отладочная информация для каждого плана
          treatmentPlansData.forEach((plan, index) => {
            console.log(`📋 План ${index + 1} (fallback):`, {
              id: plan.id,
              services: plan.services,
              selected_teeth: plan.selected_teeth,
              teeth_services: plan.teeth_services,
              total_cost: plan.total_cost
            });
          });
        } else {
          throw new Error('Неверный формат данных планов лечения');
        }
      } catch (error) {
        console.error('❌ Ошибка загрузки планов лечения из БД (fallback), используем тестовые данные:', error);
        // Fallback на тестовые данные если БД недоступна
        const testPlansWithDefaults = testTreatmentPlans.map(plan => ({
          ...plan,
          patient_phone: '',
          patient_iin: '',
          patient_birth_date: '',
          patient_allergies: '',
          patient_chronic_diseases: '',
          patient_contraindications: '',
          patient_special_notes: '',
          teethServices: plan.teethServices || {},
          toothServicesData: plan.toothServicesData || []
        }));
        setTreatmentPlans(testPlansWithDefaults);
      }
      
      // Загружаем услуги из БД (fallback)
      console.log('🔄 Загружаем услуги из БД (fallback)...');
      try {
        const { data: servicesData } = await api.get('/services/');
        if (servicesData && Array.isArray(servicesData)) {
          // Добавляем поле category для совместимости с TeethMap
          const servicesWithCategory = servicesData.map(service => ({
            ...service,
            category: 'therapy' // Временное решение, можно добавить категории в БД
          }));
          setServices(servicesWithCategory);
          console.log('✅ Услуги загружены из БД (fallback):', servicesWithCategory);
        } else {
          throw new Error('Неверный формат данных услуг');
        }
      } catch (error) {
        console.error('❌ Ошибка загрузки услуг из БД (fallback), используем тестовые данные:', error);
        setServices(testServices);
      }
    } finally {
      setLoading(false);
    }
  };


  // Управление пациентами
  const handleCreatePatient = () => {
    setEditingPatient({
      id: 0,
      full_name: '',
      phone: '+7 ',
      iin: '',
      birth_date: '',
      allergies: '',
      chronic_diseases: '',
      contraindications: '',
      special_notes: '',
      created_at: ''
    });
    setIsCreatingPatient(true);
    setShowPatientModal(true);
  };

  const handleRemovePatientFromClinic = async (clinicPatientId: number) => {
    if (window.confirm('Вы уверены, что хотите удалить этого пациента из клиники?')) {
      try {
        await clinicPatientsApi.removePatientFromClinic(clinicPatientId);
        // Обновляем список пациентов клиники
        const updatedClinicPatients = clinicPatients.filter(cp => cp.id !== clinicPatientId);
        setClinicPatients(updatedClinicPatients);
        console.log('✅ Пациент удален из клиники');
      } catch (error) {
        console.error('❌ Ошибка при удалении пациента из клиники:', error);
        alert('Ошибка при удалении пациента из клиники');
      }
    }
  };

  // Функция поиска и фильтрации пациентов
  const searchPatients = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      
      // Очищаем и нормализуем поисковый запрос из ref
      let normalizedSearch = searchValueRef.current?.trim();
      if (normalizedSearch) {
        // Убираем лишние пробелы и приводим к нижнему регистру для лучшего поиска
        normalizedSearch = normalizedSearch.replace(/\s+/g, ' ').trim();
      }
      
      const clinicPatientsData = await clinicPatientsApi.getClinicPatients(
        page, 
        100, 
        selectedDoctorId || undefined, 
        normalizedSearch || undefined
      );
      setClinicPatients(clinicPatientsData);
      console.log('✅ Пациенты найдены:', clinicPatientsData);
    } catch (error) {
      console.error('❌ Ошибка поиска пациентов:', error);
      setClinicPatients([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDoctorId]);



  // Обработчик изменения фильтра по врачу
  const handleDoctorFilterChange = (doctorId: number | null) => {
    setSelectedDoctorId(doctorId);
    searchPatients(1);
  };

  // Очистка фильтров
  const clearFilters = () => {
    searchValueRef.current = '';
    setSearchQuery('');
    setSelectedDoctorId(null);
    searchPatients(1);
  };

  // Компонент поля поиска
  const SearchInput = React.memo(() => {
    const [localValue, setLocalValue] = useState(searchQuery);
    
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setLocalValue(value);
      searchValueRef.current = value;
      
      // Очищаем предыдущий таймаут
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      
      // Если запрос пустой, сразу показываем всех пациентов
      if (!value.trim()) {
        setSearchQuery('');
        searchPatients(1);
        return;
      }
      
      // Устанавливаем новый таймаут для поиска
      searchTimeoutRef.current = setTimeout(() => {
        setSearchQuery(value);
        searchPatients(1);
      }, 300);
    }, [searchPatients]);
    
    return (
      <input
        ref={searchInputRef}
        type="text"
        placeholder="Поиск по имени, телефону или ИИН (любая часть)..."
        value={localValue}
        onChange={handleChange}
        style={{
          width: '100%',
          padding: 'clamp(0.4rem, 2vw, 0.5rem)',
          border: '1px solid #d1d5db',
          borderRadius: '0.375rem',
          fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
          outline: 'none',
          transition: 'border-color 0.2s'
        }}
        onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
        onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
      />
    );
  });

  const savePatient = async () => {
    if (!editingPatient) return;
    try {
      if (isCreatingPatient) {
        // Создаем нового пациента в БД
        console.log('💾 Сохраняем нового пациента в БД:', editingPatient);
        
        const { data: newPatient } = await api.post('/patients/', {
          full_name: editingPatient.full_name,
          phone: editingPatient.phone,
          iin: editingPatient.iin,
          birth_date: editingPatient.birth_date,
          allergies: editingPatient.allergies || '',
          chronic_diseases: editingPatient.chronic_diseases || '',
          contraindications: editingPatient.contraindications || '',
          special_notes: editingPatient.special_notes || ''
        });

        if (newPatient) {
          console.log('✅ Пациент успешно создан в БД:', newPatient);
          
          // Добавляем пациента в локальное состояние
          setPatients([...patients, newPatient]);
          
          setShowPatientModal(false);
          setEditingPatient(null);
          setIsCreatingPatient(false);
        } else {
          console.error('❌ Ошибка при создании пациента');
          alert('Ошибка при создании пациента');
        }
      } else {
        // Обновляем существующего пациента в БД
        console.log('💾 Обновляем пациента в БД:', editingPatient);
        
        const { data: updatedPatient } = await api.put(`/patients/${editingPatient.id}`, {
          full_name: editingPatient.full_name,
          phone: editingPatient.phone,
          iin: editingPatient.iin,
          birth_date: editingPatient.birth_date,
          allergies: editingPatient.allergies || '',
          chronic_diseases: editingPatient.chronic_diseases || '',
          contraindications: editingPatient.contraindications || '',
          special_notes: editingPatient.special_notes || ''
        });

        if (updatedPatient) {
          console.log('✅ Пациент успешно обновлен в БД:', updatedPatient);
          
          // Обновляем пациента в локальном состоянии
          setPatients(patients.map(p => 
            p.id === editingPatient.id ? updatedPatient : p
          ));
          
          setShowPatientModal(false);
          setEditingPatient(null);
          setIsCreatingPatient(false);
        } else {
          console.error('❌ Ошибка при обновлении пациента');
          alert('Ошибка при обновлении пациента');
        }
      }
    } catch (error) {
      console.error('❌ Ошибка сохранения пациента:', error);
      alert('Ошибка при сохранении пациента. Проверьте консоль для деталей.');
    }
  };

  // Управление планами лечения
  const handleCreateTreatmentPlan = () => {
    setEditingTreatmentPlan({
      id: 0,
      patient_id: 0, // Будет заполнен при переходе из календаря
      patient_name: '',
      patient_phone: '',
      patient_iin: '',
      patient_birth_date: '',
      patient_allergies: '',
      patient_chronic_diseases: '',
      patient_contraindications: '',
      patient_special_notes: '',
      diagnosis: '',
      treatment_description: '',
      created_at: '',
      status: 'active',
      services: [],
      total_cost: 0,
      selected_teeth: [],
      teethServices: {}
    });
    setIsCreatingTreatmentPlan(true);
    
    // Очищаем данные о зубах и услугах для нового плана
    setTeethServices({});
    
    setShowTreatmentPlanModal(true);
  };

  const handleEditTreatmentPlan = (plan: TreatmentPlan) => {
    console.log('📝 Редактирование плана лечения:', plan);
    console.log('🔍 Данные анамнеза в редактируемом плане:');
    console.log('  - patient_allergies:', plan.patient_allergies);
    console.log('  - patient_chronic_diseases:', plan.patient_chronic_diseases);
    console.log('  - patient_contraindications:', plan.patient_contraindications);
    console.log('  - patient_special_notes:', plan.patient_special_notes);
    
    // Убеждаемся, что у плана есть все необходимые поля пациента
    const planWithDefaults = {
      ...plan,
      // Заполняем поля пациента, если они отсутствуют
      patient_name: plan.patient_name || 'Неизвестный пациент',
      patient_phone: plan.patient_phone || '',
      patient_iin: plan.patient_iin || '',
      patient_birth_date: plan.patient_birth_date || '',
      patient_allergies: plan.patient_allergies || '',
      patient_chronic_diseases: plan.patient_chronic_diseases || '',
      patient_contraindications: plan.patient_contraindications || '',
      patient_special_notes: plan.patient_special_notes || '',
      services: getPlanServices(plan),
      total_cost: getPlanTotalCost(plan),
      selected_teeth: getPlanSelectedTeeth(plan)
    };
    
    console.log('✅ План с дополненными полями пациента:', planWithDefaults);
    setEditingTreatmentPlan(planWithDefaults);
    setIsCreatingTreatmentPlan(false);
    
    // Инициализируем данные о зубах и услугах для редактируемого плана
    const planTeethServices: Record<number, number[]> = plan.teeth_services || plan.teethServices || {};
    const selectedTeeth = getPlanSelectedTeeth(plan);
    
    // Устанавливаем teethServices из плана
    setTeethServices(planTeethServices);
    
    // Инициализируем toothServicesData для новой карты зубов
    if (plan.toothServicesData) {
      // Если у плана уже есть данные в новом формате, используем их
      console.log('🦷 Используем существующие данные о зубах в новом формате:', plan.toothServicesData);
    } else {
      // Конвертируем старый формат в новый
      const newToothServicesData = Object.entries(planTeethServices).map(([toothId, serviceIds]) => ({
        toothId: parseInt(toothId),
        services: serviceIds.map(serviceId => {
          const service = services.find(s => s.id === serviceId);
          return service ? {
            id: service.id,
            name: service.name,
            price: service.price,
            category: service.category
          } : {
            id: serviceId,
            name: 'Неизвестная услуга',
            price: 0,
            category: 'unknown'
          };
        })
      }));
      
      // Обновляем план с новыми данными
      const updatedPlan = {
        ...planWithDefaults,
        toothServicesData: newToothServicesData
      };
      setEditingTreatmentPlan(updatedPlan);
      
      console.log('🦷 Конвертированы данные о зубах в новый формат:', newToothServicesData);
    }
    
    console.log('🦷 Инициализированы услуги для зубов:', planTeethServices);
    console.log('🦷 Выбранные зубы:', selectedTeeth);
    setShowTreatmentPlanModal(true);
  };

  const saveTreatmentPlan = async () => {
    if (!editingTreatmentPlan) return;
    try {
      if (isCreatingTreatmentPlan) {
        // Создаем новый план лечения с новым ID
        const newPlan = {
          ...editingTreatmentPlan,
          id: Math.max(...treatmentPlans.map(p => p.id), 0) + 1,
          patient_name: patients.find(p => p.id === editingTreatmentPlan.patient_id)?.full_name || 'Неизвестный пациент',
          created_at: new Date().toISOString().split('T')[0],
          services: getPlanServices(editingTreatmentPlan),
          total_cost: getPlanTotalCost(editingTreatmentPlan),
          selected_teeth: getPlanSelectedTeeth(editingTreatmentPlan),
          teethServices: editingTreatmentPlan.teethServices || {},
          toothServicesData: editingTreatmentPlan.toothServicesData || []
        };
        setTreatmentPlans([...treatmentPlans, newPlan]);
        
        // Сохраняем данные о зубах и услугах в БД
        console.log('💾 Сохраняем новый план лечения в БД:', newPlan);
        console.log('🦷 Данные о зубах и услугах:', teethServices);
        
        // Сохраняем план лечения в БД
        try {
          // Создаем массив услуг с информацией о зубах
          const servicesWithTeeth = [];
          for (const [toothId, serviceIds] of Object.entries(teethServices)) {
            for (const serviceId of serviceIds) {
              const service = services.find(s => s.id === serviceId);
              if (service) {
                servicesWithTeeth.push({
                  service_id: serviceId,
                  tooth_id: parseInt(toothId),
                  service_name: service.name,
                  service_price: service.price,
                  quantity: 1
                });
              }
            }
          }
          
          const response = await api.post('/treatment-plans', {
            patient_id: newPlan.patient_id,
            doctor_id: 1, // ID врача (можно получить из контекста)
            diagnosis: newPlan.diagnosis,
            notes: newPlan.treatment_description,
            services: servicesWithTeeth
          });
          
          const treatmentPlanId = response.data.id;
          
          // Сохраняем данные о зубах и услугах
          for (const [toothId, serviceIds] of Object.entries(teethServices)) {
            if (serviceIds.length > 0) {
              await api.post('/tooth-services', {
                treatment_plan_id: treatmentPlanId,
                tooth_id: parseInt(toothId),
                service_ids: serviceIds
              });
            }
          }
          
          console.log('✅ План лечения и данные о зубах успешно сохранены в БД');
        } catch (error) {
          console.error('❌ Ошибка при сохранении в БД:', error);
        }
        
      } else {
        // Обновляем существующий план
        const updatedPlan = {
          ...editingTreatmentPlan,
          services: getPlanServices(editingTreatmentPlan),
          total_cost: getPlanTotalCost(editingTreatmentPlan),
          selected_teeth: getPlanSelectedTeeth(editingTreatmentPlan),
          teethServices: editingTreatmentPlan.teethServices || {},
          toothServicesData: editingTreatmentPlan.toothServicesData || []
        };
        
        console.log('💾 Обновляем существующий план лечения:', updatedPlan);
        console.log('🔍 Данные анамнеза в обновляемом плане:');
        console.log('  - patient_allergies:', updatedPlan.patient_allergies);
        console.log('  - patient_chronic_diseases:', updatedPlan.patient_chronic_diseases);
        console.log('  - patient_contraindications:', updatedPlan.patient_contraindications);
        console.log('  - patient_special_notes:', updatedPlan.patient_special_notes);
        
        setTreatmentPlans(treatmentPlans.map(p => 
          p.id === editingTreatmentPlan.id ? updatedPlan : p
        ));
        
        // Обновляем данные о зубах и услугах в БД
        console.log('💾 Обновляем план лечения в БД:', updatedPlan);
        console.log('🦷 Обновленные данные о зубах и услугах:', teethServices);
        
        // Обновляем план лечения в БД
        try {
          // Создаем массив услуг с информацией о зубах
          const servicesWithTeeth = [];
          for (const [toothId, serviceIds] of Object.entries(teethServices)) {
            for (const serviceId of serviceIds) {
              const service = services.find(s => s.id === serviceId);
              if (service) {
                servicesWithTeeth.push({
                  service_id: serviceId,
                  tooth_id: parseInt(toothId),
                  service_name: service.name,
                  service_price: service.price,
                  quantity: 1
                });
              }
            }
          }
          
          await api.put(`/treatment-plans/${editingTreatmentPlan.id}`, {
            diagnosis: updatedPlan.diagnosis,
            notes: updatedPlan.treatment_description,
            services: servicesWithTeeth
          });
          
          // Удаляем старые данные о зубах и услугах
          await api.delete(`/tooth-services/treatment-plan/${editingTreatmentPlan.id}`);
          
          // Сохраняем новые данные о зубах и услугах
          for (const [toothId, serviceIds] of Object.entries(teethServices)) {
            if (serviceIds.length > 0) {
              await api.post('/tooth-services', {
                treatment_plan_id: editingTreatmentPlan.id,
                tooth_id: parseInt(toothId),
                service_ids: serviceIds
              });
            }
          }
          
          console.log('✅ План лечения и данные о зубах успешно обновлены в БД');
        } catch (error) {
          console.error('❌ Ошибка при обновлении в БД:', error);
        }
      }
      
      setShowTreatmentPlanModal(false);
      setEditingTreatmentPlan(null);
      setIsCreatingTreatmentPlan(false);
      
      // Показываем уведомление об успешном сохранении
      alert('✅ План лечения успешно сохранен!');
      
    } catch (error) {
      console.error('Ошибка сохранения плана лечения:', error);
      alert('❌ Ошибка при сохранении плана лечения');
    }
  };


  // Функции для навигации к плану лечения из записи на прием
  const handleNavigateToTreatmentPlan = (patient: Patient) => {
    console.log('📋 Переход к плану лечения для пациента:', patient);
    console.log('🔍 Данные анамнеза пациента при переходе:');
    console.log('  - Аллергии:', patient.allergies);
    console.log('  - Хронические заболевания:', patient.chronic_diseases);
    console.log('  - Противопоказания:', patient.contraindications);
    console.log('  - Особые примечания:', patient.special_notes);
    
    // Находим существующий план лечения для этого пациента
    const existingPlan = treatmentPlans.find(plan => plan.patient_id === patient.id);
    
    if (existingPlan) {
      // Если план существует, обновляем его данными анамнеза из записи на прием
      console.log('📋 Обновляем существующий план лечения актуальными данными анамнеза');
      const updatedPlan = {
        ...existingPlan,
        patient_name: patient.full_name,
        patient_phone: patient.phone,
        patient_iin: patient.iin,
        patient_birth_date: patient.birth_date,
        patient_allergies: patient.allergies,
        patient_chronic_diseases: patient.chronic_diseases,
        patient_contraindications: patient.contraindications,
        patient_special_notes: patient.special_notes,
        teethServices: existingPlan.teethServices || {}, // Сохраняем существующие услуги для зубов
        toothServicesData: existingPlan.toothServicesData || [] // Сохраняем существующие данные о зубах в новом формате
      };
      console.log('✅ План лечения обновлен актуальными данными:', updatedPlan);
      
      // Открываем обновленный план для редактирования
      handleEditTreatmentPlan(updatedPlan);
    } else {
      // Если плана нет, создаем новый с данными пациента
      handleCreateTreatmentPlanFromPatient(patient);
    }
    
    // Переключаемся на вкладку планов лечения
    setActiveTab('treatment-plans');
  };

  // Создание плана лечения из модалки записи
  const handleCreateTreatmentPlanFromModal = (patient: Patient) => {
    console.log('🆕 Создание плана лечения для пациента из записи:', patient);
    // Открываем модалку плана лечения с предзаполненными данными пациента
    setEditingTreatmentPlan({
      id: 0,
      patient_id: patient.id || 0,
      patient_name: patient.full_name,
      status: 'active',
      selected_teeth: [],
      teethServices: {},
      total_cost: 0,
      created_at: new Date().toISOString().split('T')[0],
      // поля анамнеза, если есть
      allergies: (patient as any).allergies || '',
      chronic_diseases: (patient as any).chronic_diseases || '',
      contraindications: (patient as any).contraindications || '',
      special_notes: (patient as any).special_notes || ''
    } as any);
    setShowTreatmentPlanModal(true);
  };

  const handleCreateTreatmentPlanFromPatient = (patient: Patient) => {
    console.log('➕ Создание плана лечения для пациента:', patient);
    console.log('🔍 Данные анамнеза пациента:');
    console.log('  - Аллергии:', patient.allergies);
    console.log('  - Хронические заболевания:', patient.chronic_diseases);
    console.log('  - Противопоказания:', patient.contraindications);
    console.log('  - Особые примечания:', patient.special_notes);
    
    // Создаем новый план лечения с данными пациента
    const newPlan: TreatmentPlan = {
      id: 0, // Временный ID, будет заменен при сохранении
      patient_id: patient.id,
      patient_name: patient.full_name,
      patient_phone: patient.phone,
      patient_iin: patient.iin,
      patient_birth_date: patient.birth_date,
      patient_allergies: patient.allergies,
      patient_chronic_diseases: patient.chronic_diseases,
      patient_contraindications: patient.contraindications,
      patient_special_notes: patient.special_notes,
      diagnosis: '',
      treatment_description: '',
      services: [],
      total_cost: 0,
      selected_teeth: [],
      teethServices: {}, // Инициализируем пустой объект услуг для зубов
      toothServicesData: [], // Инициализируем пустой массив данных о зубах и услугах в новом формате
      status: 'active',
      created_at: new Date().toISOString().split('T')[0]
    };
    
    console.log('✅ Новый план лечения создан с данными пациента:', newPlan);
    console.log('🔍 Данные анамнеза в плане лечения:');
    console.log('  - patient_allergies:', newPlan.patient_allergies);
    console.log('  - patient_chronic_diseases:', newPlan.patient_chronic_diseases);
    console.log('  - patient_contraindications:', newPlan.patient_contraindications);
    console.log('  - patient_special_notes:', newPlan.patient_special_notes);
    
    setEditingTreatmentPlan(newPlan);
    setIsCreatingTreatmentPlan(true);
    setShowTreatmentPlanModal(true);
    setTeethServices({});
  };

  // Функции для автозаполнения данных пациента в плане лечения
  const handlePatientIINChange = async (iin: string) => {
    // Автозаполнение работает только если план создается вручную (patient_id = 0)
    if (iin.length >= 12 && editingTreatmentPlan?.patient_id === 0) {
      const patient = patients.find(p => p.iin === iin);
      if (patient) {
        console.log('✅ Пациент найден по ИИН:', patient);
        setEditingTreatmentPlan(prev => prev ? {
          ...prev,
          patient_id: patient.id,
          patient_name: patient.full_name,
          patient_phone: patient.phone,
          patient_iin: patient.iin,
          birth_date: patient.birth_date,
          patient_allergies: patient.allergies,
          patient_chronic_diseases: patient.chronic_diseases,
          patient_contraindications: patient.contraindications,
          patient_special_notes: patient.special_notes
        } : null);
      } else {
        console.log('❌ Пациент с ИИН', iin, 'не найден');
      }
    }
  };

  const handlePatientPhoneChange = async (phone: string) => {
    // Автозаполнение работает только если план создается вручную (patient_id = 0)
    if (phone.length >= 10 && editingTreatmentPlan?.patient_id === 0) {
      const patient = patients.find(p => p.phone === phone);
      if (patient) {
        console.log('✅ Пациент найден по телефону:', patient);
        setEditingTreatmentPlan(prev => prev ? {
          ...prev,
          patient_id: patient.id,
          patient_name: patient.full_name,
          patient_phone: patient.phone,
          patient_iin: patient.iin,
          patient_birth_date: patient.birth_date,
          patient_allergies: patient.allergies,
          patient_chronic_diseases: patient.chronic_diseases,
          patient_contraindications: patient.contraindications,
          patient_special_notes: patient.special_notes
        } : null);
      } else {
        console.log('❌ Пациент с телефоном', phone, 'не найден');
      }
    }
  };



  // Функция для извлечения даты рождения из ИИН
  const extractBirthDateFromIIN = (iin: string): string => {
    if (iin.length < 6) return '';
    
    const datePart = iin.substring(0, 6);
    const year = datePart.substring(0, 2);
    const month = datePart.substring(2, 4);
    const day = datePart.substring(4, 6);
    
    // Определяем полный год
    const currentYear = new Date().getFullYear();
    const currentYearLastTwo = currentYear % 100;
    const fullYear = parseInt(year) <= currentYearLastTwo ? 2000 + parseInt(year) : 1900 + parseInt(year);
    
    // Проверяем валидность даты
    const date = new Date(fullYear, parseInt(month) - 1, parseInt(day));
    if (date.getFullYear() === fullYear && date.getMonth() === parseInt(month) - 1 && date.getDate() === parseInt(day)) {
      return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    return '';
  };

  // Обработчик изменения ИИН с автоматическим заполнением даты рождения
  const handleIINChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingPatient) return;
    
    const iin = e.target.value;
    const birthDate = extractBirthDateFromIIN(iin);
    
    setEditingPatient({
      ...editingPatient,
      iin: iin,
      birth_date: birthDate || editingPatient.birth_date
    });
  };

  // Обработчик изменения телефона с форматированием
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingPatient) return;
    
    let phone = e.target.value;
    
    // Убираем все кроме цифр
    phone = phone.replace(/\D/g, '');
    
    // Если номер начинается с 8, заменяем на 7
    if (phone.startsWith('8')) {
      phone = '7' + phone.substring(1);
    }
    
    // Если номер начинается с 7, убираем первую 7 (так как +7 уже есть)
    if (phone.startsWith('7')) {
      phone = phone.substring(1);
    }
    
    // Ограничиваем длину до 10 цифр (без кода страны)
    if (phone.length > 10) {
      phone = phone.substring(0, 10);
    }
    
    // Форматируем номер
    let formattedPhone = '+7';
    if (phone.length > 0) {
      formattedPhone += ' (' + phone.substring(0, 3);
      if (phone.length > 3) {
        formattedPhone += ') ' + phone.substring(3, 6);
        if (phone.length > 6) {
          formattedPhone += '-' + phone.substring(6, 8);
          if (phone.length > 8) {
            formattedPhone += '-' + phone.substring(8, 10);
          }
        }
      }
    }
    
    setEditingPatient({
      ...editingPatient,
      phone: formattedPhone
    });
  };



  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div>Загрузка...</div>
      </div>
    );
  }

  return (
    <>
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', paddingTop: 0, marginTop: 0, padding: 0 }}>

        {/* Пациенты */}
        {activeTab === 'patients' && (
          <div style={{ width: '100%', maxWidth: '100%' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: 'clamp(0.5rem, 2vw, 1rem)',
              flexWrap: 'wrap',
              gap: 'clamp(0.5rem, 2vw, 1rem)'
            }}>
              <h2 style={{ 
                fontSize: 'clamp(1.2rem, 3vw, 1.5rem)',
                margin: 0
              }}>Пациенты клиники</h2>
              <button
                onClick={handleCreatePatient}
                style={{
                  backgroundColor: '#059669',
                  color: 'white',
                  border: 'none',
                  padding: 'clamp(0.4rem, 2vw, 0.5rem) clamp(0.8rem, 3vw, 1rem)',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
                  whiteSpace: 'nowrap',
                  minWidth: 'fit-content'
                }}
              >
                + Добавить пациента
              </button>
            </div>

            {/* Поиск и фильтры */}
            <div style={{
              backgroundColor: '#f8fafc',
              padding: 'clamp(0.75rem, 2vw, 1rem)',
              borderRadius: '0.5rem',
              marginBottom: 'clamp(0.75rem, 2vw, 1rem)',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{
                display: 'flex',
                gap: 'clamp(0.5rem, 2vw, 1rem)',
                flexWrap: 'wrap',
                alignItems: 'center'
              }}>
                {/* Поиск */}
                <div style={{ flex: '1', minWidth: '200px' }}>
                  <SearchInput />
                </div>

                {/* Фильтр по врачу */}
                <div style={{ minWidth: '150px' }}>
                  <select
                    value={selectedDoctorId || ''}
                    onChange={(e) => handleDoctorFilterChange(e.target.value ? Number(e.target.value) : null)}
                    style={{
                      width: '100%',
                      padding: 'clamp(0.4rem, 2vw, 0.5rem)',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
                      outline: 'none',
                      backgroundColor: 'white'
                    }}
                  >
                    <option value="">Все врачи</option>
                    {doctorsStats.map(doctor => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.full_name} ({doctor.patient_count} пациентов)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Кнопка очистки */}
                <button
                  onClick={clearFilters}
                  style={{
                    backgroundColor: '#6b7280',
                    color: 'white',
                    border: 'none',
                    padding: 'clamp(0.4rem, 2vw, 0.5rem) clamp(0.8rem, 3vw, 1rem)',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Очистить
                </button>
              </div>

              {/* Статистика */}
              {doctorsStats.length > 0 && (
                <div style={{
                  marginTop: 'clamp(0.5rem, 2vw, 0.75rem)',
                  padding: 'clamp(0.5rem, 2vw, 0.75rem)',
                  backgroundColor: 'white',
                  borderRadius: '0.375rem',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{
                    fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
                    color: '#6b7280',
                    marginBottom: 'clamp(0.25rem, 1vw, 0.5rem)'
                  }}>
                    Статистика по врачам:
                  </div>
                  <div style={{
                    display: 'flex',
                    gap: 'clamp(0.5rem, 2vw, 1rem)',
                    flexWrap: 'wrap'
                  }}>
                    {doctorsStats.map(doctor => (
                      <div key={doctor.id} style={{
                        padding: 'clamp(0.25rem, 1vw, 0.5rem) clamp(0.5rem, 2vw, 0.75rem)',
                        backgroundColor: selectedDoctorId === doctor.id ? '#dbeafe' : '#f3f4f6',
                        borderRadius: '0.25rem',
                        fontSize: 'clamp(0.7rem, 2vw, 0.8rem)',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onClick={() => handleDoctorFilterChange(doctor.id)}
                      >
                        {doctor.full_name}: {doctor.patient_count} пациентов
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              overflow: 'auto',
              width: '100%'
            }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse',
                minWidth: '800px' // Минимальная ширина для предотвращения слишком сжатых колонок
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb' }}>
                    <th style={{ 
                      padding: 'clamp(0.5rem, 2vw, 1rem)', 
                      textAlign: 'left', 
                      borderBottom: '1px solid #e5e7eb',
                      fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
                      minWidth: '40px'
                    }}>ID</th>
                    <th style={{ 
                      padding: 'clamp(0.5rem, 2vw, 1rem)', 
                      textAlign: 'left', 
                      borderBottom: '1px solid #e5e7eb',
                      fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
                      minWidth: '120px'
                    }}>Имя</th>
                    <th style={{ 
                      padding: 'clamp(0.5rem, 2vw, 1rem)', 
                      textAlign: 'left', 
                      borderBottom: '1px solid #e5e7eb',
                      fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
                      minWidth: '120px'
                    }}>Телефон</th>
                    <th style={{ 
                      padding: 'clamp(0.5rem, 2vw, 1rem)', 
                      textAlign: 'left', 
                      borderBottom: '1px solid #e5e7eb',
                      fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
                      minWidth: '100px'
                    }}>ИИН</th>
                    <th style={{ 
                      padding: 'clamp(0.5rem, 2vw, 1rem)', 
                      textAlign: 'left', 
                      borderBottom: '1px solid #e5e7eb',
                      fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
                      minWidth: '100px'
                    }}>Первое посещение</th>
                    <th style={{ 
                      padding: 'clamp(0.5rem, 2vw, 1rem)', 
                      textAlign: 'left', 
                      borderBottom: '1px solid #e5e7eb',
                      fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
                      minWidth: '120px'
                    }}>Последнее посещение</th>
                    <th style={{ 
                      padding: 'clamp(0.5rem, 2vw, 1rem)', 
                      textAlign: 'left', 
                      borderBottom: '1px solid #e5e7eb',
                      fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
                      minWidth: '120px'
                    }}>Статус</th>
                    <th style={{ 
                      padding: 'clamp(0.5rem, 2vw, 1rem)', 
                      textAlign: 'left', 
                      borderBottom: '1px solid #e5e7eb',
                      fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
                      minWidth: '120px'
                    }}>Клиника</th>
                    <th style={{ 
                      padding: 'clamp(0.5rem, 2vw, 1rem)', 
                      textAlign: 'left', 
                      borderBottom: '1px solid #e5e7eb',
                      fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
                      minWidth: '150px'
                    }}>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {clinicPatients.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ 
                        padding: '2rem', 
                        textAlign: 'center', 
                        color: '#6b7280',
                        fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)'
                      }}>
                        {loading ? 'Загрузка...' : 'Пациенты не найдены'}
                      </td>
                    </tr>
                  ) : (
                    clinicPatients.map(clinicPatient => (
                    <tr key={clinicPatient.id}>
                      <td style={{ 
                        padding: 'clamp(0.5rem, 2vw, 1rem)', 
                        borderBottom: '1px solid #e5e7eb',
                        fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)'
                      }}>{clinicPatient.patient_id}</td>
                      <td style={{ 
                        padding: 'clamp(0.5rem, 2vw, 1rem)', 
                        borderBottom: '1px solid #e5e7eb',
                        fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
                        fontWeight: '500'
                      }}>{clinicPatient.patient_name}</td>
                      <td style={{ 
                        padding: 'clamp(0.5rem, 2vw, 1rem)', 
                        borderBottom: '1px solid #e5e7eb',
                        fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
                        whiteSpace: 'nowrap'
                      }}>{clinicPatient.patient_phone}</td>
                      <td style={{ 
                        padding: 'clamp(0.5rem, 2vw, 1rem)', 
                        borderBottom: '1px solid #e5e7eb',
                        fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
                        whiteSpace: 'nowrap'
                      }}>{clinicPatient.patient_iin}</td>
                      <td style={{ 
                        padding: 'clamp(0.5rem, 2vw, 1rem)', 
                        borderBottom: '1px solid #e5e7eb',
                        fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
                        whiteSpace: 'nowrap'
                      }}>{clinicPatient.first_visit_date ? new Date(clinicPatient.first_visit_date).toLocaleDateString() : '-'}</td>
                      <td style={{ 
                        padding: 'clamp(0.5rem, 2vw, 1rem)', 
                        borderBottom: '1px solid #e5e7eb',
                        fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
                        maxWidth: '120px', 
                        wordWrap: 'break-word',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {clinicPatient.last_visit_date ? new Date(clinicPatient.last_visit_date).toLocaleDateString() : '-'}
                      </td>
                      <td style={{ 
                        padding: 'clamp(0.5rem, 2vw, 1rem)', 
                        borderBottom: '1px solid #e5e7eb',
                        fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
                        maxWidth: '120px', 
                        wordWrap: 'break-word',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {clinicPatient.is_active ? 'Активен' : 'Неактивен'}
                      </td>
                      <td style={{ 
                        padding: 'clamp(0.5rem, 2vw, 1rem)', 
                        borderBottom: '1px solid #e5e7eb',
                        fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
                        maxWidth: '120px', 
                        wordWrap: 'break-word',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {clinicPatient.clinic_name || '-'}
                      </td>
                      <td style={{ 
                        padding: 'clamp(0.5rem, 2vw, 1rem)', 
                        borderBottom: '1px solid #e5e7eb',
                        fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
                        maxWidth: '120px', 
                        wordWrap: 'break-word',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {clinicPatient.clinic_name || '-'}
                      </td>
                      <td style={{ 
                        padding: 'clamp(0.5rem, 2vw, 1rem)', 
                        borderBottom: '1px solid #e5e7eb'
                      }}>
                        <div style={{ 
                          display: 'flex', 
                          gap: 'clamp(0.25rem, 1vw, 0.5rem)', 
                          flexWrap: 'wrap',
                          justifyContent: 'flex-start'
                        }}>
                          <button
                            onClick={() => navigate(`/patient/${clinicPatient.patient_id}`)}
                            style={{
                              backgroundColor: '#059669',
                              color: 'white',
                              border: 'none',
                              padding: 'clamp(0.2rem, 1vw, 0.25rem) clamp(0.4rem, 2vw, 0.5rem)',
                              borderRadius: '0.25rem',
                              cursor: 'pointer',
                              fontSize: 'clamp(0.7rem, 2vw, 0.8rem)',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            ЛК пациента
                          </button>
                          <button
                            onClick={() => handleRemovePatientFromClinic(clinicPatient.id)}
                            style={{
                              backgroundColor: '#dc2626',
                              color: 'white',
                              border: 'none',
                              padding: 'clamp(0.2rem, 1vw, 0.25rem) clamp(0.4rem, 2vw, 0.5rem)',
                              borderRadius: '0.25rem',
                              cursor: 'pointer',
                              fontSize: 'clamp(0.7rem, 2vw, 0.8rem)',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            Удалить из клиники
                          </button>
                        </div>
                      </td>
                    </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}



                {/* Планы лечения */}
        {activeTab === 'treatment-plans' && (
          <div style={{ width: '100%', maxWidth: '100%' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: 'clamp(0.5rem, 2vw, 1rem)',
              flexWrap: 'wrap',
              gap: 'clamp(0.5rem, 2vw, 1rem)'
            }}>
              <h2 style={{ 
                fontSize: 'clamp(1.2rem, 3vw, 1.5rem)',
                margin: 0
              }}>Планы лечения</h2>
              <button
                onClick={handleCreateTreatmentPlan}
                style={{
                  backgroundColor: '#059669',
                  color: 'white',
                  border: 'none',
                  padding: 'clamp(0.4rem, 2vw, 0.5rem) clamp(0.8rem, 3vw, 1rem)',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
                  whiteSpace: 'nowrap',
                  minWidth: 'fit-content'
                }}
              >
                + Добавить план лечения
              </button>
            </div>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              overflow: 'auto',
              width: '100%'
            }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse',
                minWidth: '900px' // Минимальная ширина для предотвращения слишком сжатых колонок
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb' }}>
                    <th style={{ 
                      padding: 'clamp(0.5rem, 2vw, 1rem)', 
                      textAlign: 'left', 
                      borderBottom: '1px solid #e5e7eb',
                      fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
                      minWidth: '40px'
                    }}>ID</th>
                    <th style={{ 
                      padding: 'clamp(0.5rem, 2vw, 1rem)', 
                      textAlign: 'left', 
                      borderBottom: '1px solid #e5e7eb',
                      fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
                      minWidth: '120px'
                    }}>Пациент</th>
                    <th style={{ 
                      padding: 'clamp(0.5rem, 2vw, 1rem)', 
                      textAlign: 'left', 
                      borderBottom: '1px solid #e5e7eb',
                      fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
                      minWidth: '150px'
                    }}>Диагноз</th>
                    <th style={{ 
                      padding: 'clamp(0.5rem, 2vw, 1rem)', 
                      textAlign: 'left', 
                      borderBottom: '1px solid #e5e7eb',
                      fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
                      minWidth: '100px'
                    }}>Зубы</th>
                    <th style={{ 
                      padding: 'clamp(0.5rem, 2vw, 1rem)', 
                      textAlign: 'left', 
                      borderBottom: '1px solid #e5e7eb',
                      fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
                      minWidth: '150px'
                    }}>Услуги</th>
                    <th style={{ 
                      padding: 'clamp(0.5rem, 2vw, 1rem)', 
                      textAlign: 'left', 
                      borderBottom: '1px solid #e5e7eb',
                      fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
                      minWidth: '100px'
                    }}>Стоимость</th>
                    <th style={{ 
                      padding: 'clamp(0.5rem, 2vw, 1rem)', 
                      textAlign: 'left', 
                      borderBottom: '1px solid #e5e7eb',
                      fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
                      minWidth: '80px'
                    }}>Статус</th>
                    <th style={{ 
                      padding: 'clamp(0.5rem, 2vw, 1rem)', 
                      textAlign: 'left', 
                      borderBottom: '1px solid #e5e7eb',
                      fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
                      minWidth: '100px'
                    }}>Дата создания</th>
                    <th style={{ 
                      padding: 'clamp(0.5rem, 2vw, 1rem)', 
                      textAlign: 'left', 
                      borderBottom: '1px solid #e5e7eb',
                      fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
                      minWidth: '120px'
                    }}>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {treatmentPlans.map(plan => (
                    <tr key={plan.id}>
                      <td style={{ 
                        padding: 'clamp(0.5rem, 2vw, 1rem)', 
                        borderBottom: '1px solid #e5e7eb',
                        fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)'
                      }}>{plan.id}</td>
                      <td style={{ 
                        padding: 'clamp(0.5rem, 2vw, 1rem)', 
                        borderBottom: '1px solid #e5e7eb',
                        fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
                        fontWeight: '500'
                      }}>{plan.patient_name}</td>
                      <td style={{ 
                        padding: 'clamp(0.5rem, 2vw, 1rem)', 
                        borderBottom: '1px solid #e5e7eb',
                        fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
                        maxWidth: '150px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>{plan.diagnosis}</td>
                      <td style={{ 
                        padding: 'clamp(0.5rem, 2vw, 1rem)', 
                        borderBottom: '1px solid #e5e7eb'
                      }}>
                        <div style={{ fontSize: 'clamp(0.7rem, 2vw, 0.8rem)' }}>
                          {getPlanSelectedTeeth(plan).length > 0 ? (
                            getPlanSelectedTeeth(plan).map(toothId => (
                              <span key={toothId} style={{
                                display: 'inline-block',
                                backgroundColor: '#3b82f6',
                                color: 'white',
                                padding: 'clamp(0.15rem, 1vw, 0.25rem) clamp(0.3rem, 2vw, 0.5rem)',
                                borderRadius: '0.25rem',
                                margin: '0.125rem',
                                fontSize: 'clamp(0.6rem, 1.8vw, 0.75rem)',
                                fontWeight: '500'
                              }}>
                                {toothId}
                              </span>
                            ))
                          ) : (
                            <span style={{ 
                              color: '#9ca3af', 
                              fontStyle: 'italic',
                              fontSize: 'clamp(0.7rem, 2vw, 0.8rem)'
                            }}>Зубы не выбраны</span>
                          )}
                        </div>
                      </td>
                      <td style={{ 
                        padding: 'clamp(0.5rem, 2vw, 1rem)', 
                        borderBottom: '1px solid #e5e7eb',
                        maxWidth: '150px'
                      }}>
                        <div style={{ 
                          fontSize: 'clamp(0.7rem, 2vw, 0.8rem)',
                          maxHeight: '60px',
                          overflow: 'hidden'
                        }}>
                          {getPlanServices(plan).length > 0 ? (
                            getPlanServices(plan).slice(0, 2).map(serviceId => {
                              const service = services.find(s => s.id === serviceId);
                              return service ? (
                                <div key={serviceId} style={{ marginBottom: '0.25rem' }}>
                                  <span style={{ 
                                    fontWeight: '500',
                                    fontSize: 'clamp(0.7rem, 2vw, 0.8rem)'
                                  }}>{service.name}</span>
                                  <span style={{ 
                                    color: '#6b7280', 
                                    marginLeft: '0.5rem',
                                    fontSize: 'clamp(0.6rem, 1.8vw, 0.7rem)'
                                  }}>
                                    ({service.price.toLocaleString()} ₸)
                                  </span>
                                </div>
                              ) : null;
                            })
                          ) : (
                            <span style={{ 
                              color: '#9ca3af', 
                              fontStyle: 'italic',
                              fontSize: 'clamp(0.7rem, 2vw, 0.8rem)'
                            }}>Услуги не выбраны</span>
                          )}
                          {getPlanServices(plan).length > 2 && (
                            <div style={{ 
                              color: '#6b7280',
                              fontSize: 'clamp(0.6rem, 1.8vw, 0.7rem)'
                            }}>
                              +{getPlanServices(plan).length - 2} ещё
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={{ 
                        padding: 'clamp(0.5rem, 2vw, 1rem)', 
                        borderBottom: '1px solid #e5e7eb'
                      }}>
                        <span style={{ 
                          fontWeight: '500', 
                          color: '#059669',
                          fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
                          whiteSpace: 'nowrap'
                        }}>
                          {getPlanTotalCost(plan).toLocaleString()} ₸
                        </span>
                      </td>
                      <td style={{ 
                        padding: 'clamp(0.5rem, 2vw, 1rem)', 
                        borderBottom: '1px solid #e5e7eb'
                      }}>
                        <span style={{
                          backgroundColor: plan.status === 'active' ? '#dcfce7' : 
                                         plan.status === 'completed' ? '#dbeafe' : '#fef2f2',
                          color: plan.status === 'active' ? '#166534' : 
                                 plan.status === 'completed' ? '#1e40af' : '#dc2626',
                          padding: 'clamp(0.2rem, 1vw, 0.25rem) clamp(0.4rem, 2vw, 0.5rem)',
                          borderRadius: '0.25rem',
                          fontSize: 'clamp(0.7rem, 2vw, 0.8rem)',
                          whiteSpace: 'nowrap'
                        }}>
                          {plan.status === 'active' ? 'Активен' : 
                           plan.status === 'completed' ? 'Завершен' : 'Отменен'}
                        </span>
                      </td>
                      <td style={{ 
                        padding: 'clamp(0.5rem, 2vw, 1rem)', 
                        borderBottom: '1px solid #e5e7eb',
                        fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
                        whiteSpace: 'nowrap'
                      }}>{plan.created_at}</td>
                      <td style={{ 
                        padding: 'clamp(0.5rem, 2vw, 1rem)', 
                        borderBottom: '1px solid #e5e7eb'
                      }}>
                        <button
                          onClick={() => handleEditTreatmentPlan(plan)}
                          style={{
                            backgroundColor: '#2563eb',
                            color: 'white',
                            border: 'none',
                            padding: 'clamp(0.2rem, 1vw, 0.25rem) clamp(0.4rem, 2vw, 0.5rem)',
                            borderRadius: '0.25rem',
                            cursor: 'pointer',
                            fontSize: 'clamp(0.7rem, 2vw, 0.8rem)',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          Редактировать
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Услуги */}
        {activeTab === 'services' && (
          <div style={{ width: '100%', maxWidth: '100%' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: 'clamp(0.5rem, 2vw, 1rem)',
              flexWrap: 'wrap',
              gap: 'clamp(0.5rem, 2vw, 1rem)'
            }}>
              <h2 style={{ 
                fontSize: 'clamp(1.2rem, 3vw, 1.5rem)',
                margin: 0
              }}>Услуги</h2>
            </div>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              overflow: 'auto',
              width: '100%'
            }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse',
                minWidth: '600px' // Минимальная ширина для предотвращения слишком сжатых колонок
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb' }}>
                    <th style={{ 
                      padding: 'clamp(0.5rem, 2vw, 1rem)', 
                      textAlign: 'left', 
                      borderBottom: '1px solid #e5e7eb',
                      fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
                      minWidth: '40px'
                    }}>ID</th>
                    <th style={{ 
                      padding: 'clamp(0.5rem, 2vw, 1rem)', 
                      textAlign: 'left', 
                      borderBottom: '1px solid #e5e7eb',
                      fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
                      minWidth: '150px'
                    }}>Название</th>
                    <th style={{ 
                      padding: 'clamp(0.5rem, 2vw, 1rem)', 
                      textAlign: 'left', 
                      borderBottom: '1px solid #e5e7eb',
                      fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
                      minWidth: '100px'
                    }}>Категория</th>
                    <th style={{ 
                      padding: 'clamp(0.5rem, 2vw, 1rem)', 
                      textAlign: 'left', 
                      borderBottom: '1px solid #e5e7eb',
                      fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
                      minWidth: '80px'
                    }}>Стоимость</th>
                    <th style={{ 
                      padding: 'clamp(0.5rem, 2vw, 1rem)', 
                      textAlign: 'left', 
                      borderBottom: '1px solid #e5e7eb',
                      fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
                      minWidth: '80px'
                    }}>Длительность</th>
                    <th style={{ 
                      padding: 'clamp(0.5rem, 2vw, 1rem)', 
                      textAlign: 'left', 
                      borderBottom: '1px solid #e5e7eb',
                      fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
                      minWidth: '80px'
                    }}>Статус</th>
                    <th style={{ 
                      padding: 'clamp(0.5rem, 2vw, 1rem)', 
                      textAlign: 'left', 
                      borderBottom: '1px solid #e5e7eb',
                      fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
                      minWidth: '100px'
                    }}>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map(service => (
                    <tr key={service.id}>
                      <td style={{ 
                        padding: 'clamp(0.5rem, 2vw, 1rem)', 
                        borderBottom: '1px solid #e5e7eb',
                        fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)'
                      }}>{service.id}</td>
                      <td style={{ 
                        padding: 'clamp(0.5rem, 2vw, 1rem)', 
                        borderBottom: '1px solid #e5e7eb'
                      }}>
                        <div>
                          <div style={{ 
                            fontWeight: '500', 
                            marginBottom: '0.25rem',
                            fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)'
                          }}>{service.name}</div>
                          <div style={{ 
                            fontSize: 'clamp(0.7rem, 2vw, 0.8rem)', 
                            color: '#6b7280',
                            lineHeight: '1.3'
                          }}>{service.description}</div>
                        </div>
                      </td>
                      <td style={{ 
                        padding: 'clamp(0.5rem, 2vw, 1rem)', 
                        borderBottom: '1px solid #e5e7eb'
                      }}>
                        <span style={{
                          backgroundColor: service.category === 'therapy' ? '#dcfce7' : 
                                         service.category === 'surgery' ? '#fef2f2' : '#dbeafe',
                          color: service.category === 'therapy' ? '#166534' : 
                                 service.category === 'surgery' ? '#dc2626' : '#1e40af',
                          padding: 'clamp(0.2rem, 1vw, 0.25rem) clamp(0.4rem, 2vw, 0.5rem)',
                          borderRadius: '0.25rem',
                          fontSize: 'clamp(0.7rem, 2vw, 0.8rem)',
                          whiteSpace: 'nowrap'
                        }}>
                          {service.category === 'therapy' ? 'Терапия' : 
                           service.category === 'surgery' ? 'Хирургия' : 
                           service.category === 'prosthetics' ? 'Протезирование' : service.category}
                        </span>
                      </td>
                      <td style={{ 
                        padding: 'clamp(0.5rem, 2vw, 1rem)', 
                        borderBottom: '1px solid #e5e7eb'
                      }}>
                        <span style={{ 
                          fontWeight: '500', 
                          color: '#059669',
                          fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
                          whiteSpace: 'nowrap'
                        }}>
                          {service.price.toLocaleString()} ₸
                        </span>
                      </td>
                      <td style={{ 
                        padding: 'clamp(0.5rem, 2vw, 1rem)', 
                        borderBottom: '1px solid #e5e7eb',
                        fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
                        whiteSpace: 'nowrap'
                      }}>{service.duration}</td>
                      <td style={{ 
                        padding: 'clamp(0.5rem, 2vw, 1rem)', 
                        borderBottom: '1px solid #e5e7eb'
                      }}>
                        <span style={{
                          backgroundColor: service.is_active ? '#dcfce7' : '#fef2f2',
                          color: service.is_active ? '#166534' : '#dc2626',
                          padding: 'clamp(0.2rem, 1vw, 0.25rem) clamp(0.4rem, 2vw, 0.5rem)',
                          borderRadius: '0.25rem',
                          fontSize: 'clamp(0.7rem, 2vw, 0.8rem)',
                          whiteSpace: 'nowrap'
                        }}>
                          {service.is_active ? 'Активна' : 'Неактивна'}
                        </span>
                      </td>
                      <td style={{ 
                        padding: 'clamp(0.5rem, 2vw, 1rem)', 
                        borderBottom: '1px solid #e5e7eb'
                      }}>
                        <span style={{ fontSize: 'clamp(0.7rem, 2vw, 0.8rem)' }}>
                          Только просмотр
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      {/* Модальное окно для пациента */}
      {showPatientModal && editingPatient && (
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
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '0.5rem',
            width: '600px',
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h3>{isCreatingPatient ? 'Создать пациента' : 'Редактировать пациента'}</h3>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Имя:</label>
              <input
                type="text"
                value={editingPatient.full_name}
                onChange={(e) => setEditingPatient({...editingPatient, full_name: e.target.value})}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.25rem'
                }}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Телефон:</label>
              <input
                type="text"
                value={editingPatient.phone}
                onChange={handlePhoneChange}
                placeholder="+7 (___) ___-__-__"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.25rem',
                  fontFamily: 'monospace',
                  fontSize: '1rem'
                }}
              />
              <small style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem', display: 'block' }}>
                💡 Введите только цифры номера, +7 добавится автоматически
              </small>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>ИИН:</label>
              <input
                type="text"
                value={editingPatient.iin}
                onChange={handleIINChange}
                placeholder="Введите ИИН (12 цифр)"
                maxLength={12}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.25rem'
                }}
              />
              <small style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem', display: 'block' }}>
                💡 Первые 6 цифр ИИН автоматически заполнят дату рождения
              </small>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                Дата рождения:
                {editingPatient.iin.length >= 6 && extractBirthDateFromIIN(editingPatient.iin) && (
                  <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: '#059669', fontWeight: 'normal' }}>
                    ✅ Автозаполнено из ИИН
                  </span>
                )}
              </label>
              <input
                type="date"
                value={editingPatient.birth_date}
                onChange={(e) => setEditingPatient({...editingPatient, birth_date: e.target.value})}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.25rem',
                  backgroundColor: editingPatient.iin.length >= 6 && extractBirthDateFromIIN(editingPatient.iin) ? '#f0fdf4' : 'white'
                }}
              />
            </div>

            {/* Анамнез пациента */}
            <div style={{ 
              marginBottom: '1.5rem', 
              padding: '1rem', 
              backgroundColor: '#f8fafc', 
              borderRadius: '0.5rem',
              border: '1px solid #e2e8f0'
            }}>
              <h4 style={{ 
                margin: '0 0 1rem 0', 
                fontSize: '1.125rem', 
                fontWeight: '600', 
                color: '#374151' 
              }}>
                📋 Анамнез пациента
              </h4>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Аллергии:</label>
                <textarea
                  value={editingPatient.allergies}
                  onChange={(e) => setEditingPatient({...editingPatient, allergies: e.target.value})}
                  placeholder="Укажите аллергии пациента..."
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.25rem',
                    minHeight: '60px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Хронические заболевания:</label>
                <textarea
                  value={editingPatient.chronic_diseases}
                  onChange={(e) => setEditingPatient({...editingPatient, chronic_diseases: e.target.value})}
                  placeholder="Укажите хронические заболевания..."
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.25rem',
                    minHeight: '60px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Противопоказания:</label>
                <textarea
                  value={editingPatient.contraindications}
                  onChange={(e) => setEditingPatient({...editingPatient, contraindications: e.target.value})}
                  placeholder="Укажите противопоказания..."
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.25rem',
                    minHeight: '60px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Особые примечания:</label>
                <textarea
                  value={editingPatient.special_notes}
                  onChange={(e) => setEditingPatient({...editingPatient, special_notes: e.target.value})}
                  placeholder="Дополнительная информация о пациенте..."
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.25rem',
                    minHeight: '60px',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowPatientModal(false);
                  setEditingPatient(null);
                  setIsCreatingPatient(false);
                }}
                style={{
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.25rem',
                  cursor: 'pointer'
                }}
              >
                Отмена
              </button>
              <button
                onClick={savePatient}
                style={{
                  backgroundColor: '#059669',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.25rem',
                  cursor: 'pointer'
                }}
              >
                {isCreatingPatient ? 'Создать' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}

    {/* Модальное окно для плана лечения */}
    {showTreatmentPlanModal && editingTreatmentPlan && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            padding: '1.5rem',
            borderRadius: '1rem',
            width: '90vw',
            maxWidth: '1200px',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            margin: '1rem'
          }}>
            {/* Заголовок с градиентом */}
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: '1rem',
              borderRadius: '0.75rem',
              marginBottom: '1.5rem',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: '-50%',
                right: '-50%',
                width: '200%',
                height: '200%',
                background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
                animation: 'float 6s ease-in-out infinite'
              }} />
              <h3 style={{ 
                margin: 0, 
                fontSize: 'clamp(1.5rem, 4vw, 2rem)', 
                fontWeight: '700',
                textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                position: 'relative',
                zIndex: 1
              }}>
                {isCreatingTreatmentPlan ? 
                  (editingTreatmentPlan.patient_id > 0 ? 
                    `План лечения для ${editingTreatmentPlan.patient_name}` : 
                    'Создать план лечения') : 
                  `План лечения для ${editingTreatmentPlan.patient_name}`}
              </h3>
            </div>
            


            {/* Статичные данные пациента */}
            <div style={{ 
              marginBottom: '1.5rem',
              background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
              borderRadius: '1rem',
              border: '1px solid #bae6fd',
              padding: '1rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}>
              <h4 style={{ 
                margin: '0 0 1rem 0', 
                fontSize: 'clamp(1.125rem, 3.5vw, 1.25rem)', 
                fontWeight: '600',
                color: '#0c4a6e',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span>👤</span>
                Информация о пациенте
              </h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    fontWeight: '600', 
                    fontSize: 'clamp(0.875rem, 3vw, 1rem)',
                    color: '#0c4a6e'
                  }}>ФИО:</label>
                  <div style={{
                    padding: '0.75rem',
                    backgroundColor: 'white',
                    border: '2px solid #bae6fd',
                    borderRadius: '0.5rem',
                    fontSize: 'clamp(0.875rem, 3vw, 1rem)',
                    color: '#0c4a6e',
                    fontWeight: '500'
                  }}>
                    {editingTreatmentPlan.patient_name || 'Не указано'}
                  </div>
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    fontWeight: '600', 
                    fontSize: 'clamp(0.875rem, 3vw, 1rem)',
                    color: '#0c4a6e'
                  }}>ИИН:</label>
                  <div style={{
                    padding: '0.75rem',
                    backgroundColor: 'white',
                    border: '2px solid #bae6fd',
                    borderRadius: '0.5rem',
                    fontSize: 'clamp(0.875rem, 3vw, 1rem)',
                    color: '#0c4a6e',
                    fontWeight: '500'
                  }}>
                    {editingTreatmentPlan.patient_iin || 'Не указано'}
                  </div>
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    fontWeight: '600', 
                    fontSize: 'clamp(0.875rem, 3vw, 1rem)',
                    color: '#0c4a6e'
                  }}>Дата рождения:</label>
                  <div style={{
                    padding: '0.75rem',
                    backgroundColor: 'white',
                    border: '2px solid #bae6fd',
                    borderRadius: '0.5rem',
                    fontSize: 'clamp(0.875rem, 3vw, 1rem)',
                    color: '#0c4a6e',
                    fontWeight: '500'
                  }}>
                    {editingTreatmentPlan.patient_birth_date || 'Не указано'}
                  </div>
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    fontWeight: '600', 
                    fontSize: 'clamp(0.875rem, 3vw, 1rem)',
                    color: '#0c4a6e'
                  }}>Номер телефона:</label>
                  <div style={{
                    padding: '0.75rem',
                    backgroundColor: 'white',
                    border: '2px solid #bae6fd',
                    borderRadius: '0.5rem',
                    fontSize: 'clamp(0.875rem, 3vw, 1rem)',
                    color: '#0c4a6e',
                    fontWeight: '500'
                  }}>
                    {editingTreatmentPlan.patient_phone || 'Не указано'}
                  </div>
                </div>
              </div>
            </div>

            {/* Анамнез с сворачиванием */}
            <div style={{ 
              marginBottom: '2rem',
              background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
              borderRadius: '1rem',
              border: '1px solid #cbd5e1',
              overflow: 'hidden',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}>
              {/* Заголовок секции с кнопкой сворачивания */}
              <div style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: 'white',
                padding: '1rem 1.5rem',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'all 0.3s ease'
              }} onClick={() => setIsAnamnesisCollapsed(!isAnamnesisCollapsed)}>
                <h4 style={{ 
                  margin: 0, 
                  fontSize: 'clamp(1.125rem, 3.5vw, 1.25rem)', 
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span>🏥</span>
                  Анамнез и медицинская информация
                </h4>
                <div style={{
                  transform: isAnamnesisCollapsed ? 'rotate(0deg)' : 'rotate(180deg)',
                  transition: 'transform 0.3s ease',
                  fontSize: '1.25rem'
                }}>
                  ▼
                </div>
              </div>

              {/* Содержимое секции */}
              <div style={{
                padding: isAnamnesisCollapsed ? '0 1.5rem' : '1.5rem',
                maxHeight: isAnamnesisCollapsed ? '0' : '1000px',
                overflow: 'hidden',
                transition: 'all 0.3s ease'
              }}>
                {/* Анамнез */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '0.75rem', 
                      fontWeight: '600', 
                      fontSize: 'clamp(0.875rem, 3vw, 1rem)',
                      color: '#374151'
                    }}>Аллергии:</label>
                    <textarea
                      value={editingTreatmentPlan.patient_allergies || ''}
                      onChange={(e) => setEditingTreatmentPlan({...editingTreatmentPlan, patient_allergies: e.target.value})}
                      placeholder="Укажите аллергии пациента..."
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #e2e8f0',
                        borderRadius: '0.5rem',
                        minHeight: '80px',
                        resize: 'vertical',
                        fontSize: 'clamp(0.875rem, 3vw, 1rem)',
                        transition: 'border-color 0.2s ease',
                        background: 'white'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                      onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                    />
                  </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: 'clamp(0.875rem, 3vw, 1rem)' }}>
                    ИИН:
                    {editingTreatmentPlan.patient_id === 0 && (
                      <span style={{ 
                        fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)', 
                        fontWeight: '400', 
                        color: '#6b7280',
                        marginLeft: '0.25rem'
                      }}>
                        (автозаполнение)
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={editingTreatmentPlan.patient_iin || ''}
                    onChange={(e) => {
                      setEditingTreatmentPlan({...editingTreatmentPlan, patient_iin: e.target.value});
                      handlePatientIINChange(e.target.value);
                    }}
                    placeholder="Введите ИИН пациента"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.25rem',
                      fontSize: 'clamp(0.875rem, 3vw, 1rem)'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: 'clamp(0.875rem, 3vw, 1rem)' }}>
                    Телефон:
                    {editingTreatmentPlan.patient_id === 0 && (
                      <span style={{ 
                        fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)', 
                        fontWeight: '400', 
                        color: '#6b7280',
                        marginLeft: '0.25rem'
                      }}>
                        (автозаполнение)
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={editingTreatmentPlan.patient_phone || ''}
                    onChange={(e) => {
                      setEditingTreatmentPlan({...editingTreatmentPlan, patient_phone: e.target.value});
                      handlePatientPhoneChange(e.target.value);
                    }}
                    placeholder="Введите номер телефона"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.25rem',
                      fontSize: 'clamp(0.875rem, 3vw, 1rem)'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: 'clamp(0.875rem, 3vw, 1rem)' }}>Дата рождения:</label>
                  <input
                    type="date"
                    value={editingTreatmentPlan.patient_birth_date || ''}
                    onChange={(e) => setEditingTreatmentPlan({...editingTreatmentPlan, patient_birth_date: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.25rem',
                      fontSize: 'clamp(0.875rem, 3vw, 1rem)'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: 'clamp(0.875rem, 3vw, 1rem)' }}>Аллергии:</label>
                <textarea
                  value={editingTreatmentPlan.patient_allergies || ''}
                  onChange={(e) => setEditingTreatmentPlan({...editingTreatmentPlan, patient_allergies: e.target.value})}
                  placeholder="Укажите аллергии пациента..."
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.25rem',
                    minHeight: '60px',
                    resize: 'vertical',
                    fontSize: 'clamp(0.875rem, 3vw, 1rem)'
                  }}
                />
              </div>

              <div style={{ marginTop: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: 'clamp(0.875rem, 3vw, 1rem)' }}>Хронические заболевания:</label>
                <textarea
                  value={editingTreatmentPlan.patient_chronic_diseases || ''}
                  onChange={(e) => setEditingTreatmentPlan({...editingTreatmentPlan, patient_chronic_diseases: e.target.value})}
                  placeholder="Укажите хронические заболевания..."
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.25rem',
                    minHeight: '60px',
                    resize: 'vertical',
                    fontSize: 'clamp(0.875rem, 3vw, 1rem)'
                  }}
                />
              </div>

              <div style={{ marginTop: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: 'clamp(0.875rem, 3vw, 1rem)' }}>Противопоказания:</label>
                <textarea
                  value={editingTreatmentPlan.patient_contraindications || ''}
                  onChange={(e) => setEditingTreatmentPlan({...editingTreatmentPlan, patient_contraindications: e.target.value})}
                  placeholder="Укажите противопоказания..."
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.25rem',
                    minHeight: '60px',
                    resize: 'vertical',
                    fontSize: 'clamp(0.875rem, 3vw, 1rem)'
                  }}
                />
              </div>

              <div style={{ marginTop: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: 'clamp(0.875rem, 3vw, 1rem)' }}>Особые примечания:</label>
                <textarea
                  value={editingTreatmentPlan.patient_special_notes || ''}
                  onChange={(e) => setEditingTreatmentPlan({...editingTreatmentPlan, patient_special_notes: e.target.value})}
                  placeholder="Дополнительная информация о пациенте..."
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.25rem',
                    minHeight: '60px',
                    resize: 'vertical',
                    fontSize: 'clamp(0.875rem, 3vw, 1rem)'
                  }}
                />
                  </div>
                </div>
              </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: 'clamp(0.875rem, 3vw, 1rem)' }}>Диагноз:</label>
              <textarea
                value={editingTreatmentPlan.diagnosis}
                onChange={(e) => setEditingTreatmentPlan({...editingTreatmentPlan, diagnosis: e.target.value})}
                placeholder="Опишите диагноз пациента..."
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.25rem',
                  minHeight: '80px',
                  resize: 'vertical',
                  fontSize: 'clamp(0.875rem, 3vw, 1rem)'
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: 'clamp(0.875rem, 3vw, 1rem)' }}>Описание лечения:</label>
              <textarea
                value={editingTreatmentPlan.treatment_description}
                onChange={(e) => setEditingTreatmentPlan({...editingTreatmentPlan, treatment_description: e.target.value})}
                placeholder="Опишите план лечения, этапы, процедуры..."
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.25rem',
                  minHeight: '120px',
                  resize: 'vertical',
                  fontSize: 'clamp(0.875rem, 3vw, 1rem)'
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: 'clamp(0.875rem, 3vw, 1rem)' }}>Статус:</label>
              <select
                value={editingTreatmentPlan.status}
                onChange={(e) => setEditingTreatmentPlan({...editingTreatmentPlan, status: e.target.value})}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.25rem',
                  fontSize: 'clamp(0.875rem, 3vw, 1rem)'
                }}
              >
                <option value="active">Активен</option>
                <option value="completed">Завершен</option>
                <option value="cancelled">Отменен</option>
              </select>
            </div>

            {/* Карта зубов и выбор услуг */}
            <div style={{ marginBottom: '1rem' }}>
              <TeethMap
                services={services}
                selectedTeeth={editingTreatmentPlan?.selected_teeth || []}
                teethServices={editingTreatmentPlan?.teethServices || {}}
                onToothServicesChange={(newToothServices) => {
                  console.log('🦷 Новые данные о зубах и услугах:', newToothServices);
                  
                  // Конвертируем новый формат в старый для совместимости
                  const newTeethServices: Record<number, number[]> = {};
                  newToothServices.forEach(ts => {
                    newTeethServices[ts.toothId] = ts.services.map(s => s.id);
                  });
                  setTeethServices(newTeethServices);
                  
                  // Обновляем выбранные зубы
                  const newSelectedTeeth = newToothServices.map(ts => ts.toothId);
                  
                  // Обновляем план лечения с новыми данными
                  setEditingTreatmentPlan(prev => prev ? {
                    ...prev,
                    selected_teeth: newSelectedTeeth,
                    teethServices: newTeethServices,
                    toothServicesData: newToothServices
                  } : null);
                  
                  console.log('✅ План лечения обновлен с новыми данными о зубах');
                }}
                onToothSelect={(toothId) => {
                  console.log('🦷 Выбран зуб:', toothId);
                  // Логика выбора зуба уже обрабатывается в TeethMap
                }}
                onAddServiceToTooth={(toothId, serviceId) => {
                  console.log('🦷 Добавлена услуга к зубу:', toothId, serviceId);
                  // Обновляем зубы и услуги
                  setTeethServices(prev => ({
                    ...prev,
                    [toothId]: [...(prev[toothId] || []), serviceId]
                  }));
                }}
                onRemoveServiceFromTooth={(toothId, serviceId) => {
                  console.log('🦷 Удалена услуга с зуба:', toothId, serviceId);
                  // Удаляем услугу с зуба
                  setTeethServices(prev => ({
                    ...prev,
                    [toothId]: (prev[toothId] || []).filter(id => id !== serviceId)
                  }));
                }}
                onClearSelection={() => {
                  console.log('🦷 Очищен выбор зубов');
                  setTeethServices({});
                  setEditingTreatmentPlan(prev => prev ? {
                    ...prev,
                    selected_teeth: [],
                    teethServices: {}
                  } : null);
                }}
              />
            </div>

            {/* Выбранные зубы с услугами */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: 'clamp(0.875rem, 3vw, 1rem)' }}>
                🦷 Выбранные зубы с услугами:
              </label>
              <div style={{ 
                border: '1px solid #d1d5db', 
                borderRadius: '0.25rem', 
                padding: '0.5rem',
                backgroundColor: '#f8fafc',
                maxHeight: '300px',
                overflow: 'auto'
              }}>
                {Object.entries(teethServices).map(([toothId, serviceIds]) => {
                  const toothServices = services.filter(s => serviceIds.includes(s.id));
                  const toothTotalCost = toothServices.reduce((sum, s) => sum + Number(s.price), 0);
                  
                  return (
                    <div key={toothId} style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.25rem',
                      padding: '0.75rem',
                      marginBottom: '0.5rem',
                      backgroundColor: 'white'
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginBottom: '0.5rem'
                      }}>
                        <h5 style={{ 
                          margin: 0, 
                          fontSize: '1rem', 
                          fontWeight: '600', 
                          color: '#374151' 
                        }}>
                          🦷 Зуб {toothId}
                        </h5>
                        <button
                          type="button"
                          onClick={() => {
                            const newSelectedTeeth = editingTreatmentPlan.selected_teeth.filter(id => id !== parseInt(toothId));
                            setEditingTreatmentPlan(prev => prev ? {
                              ...prev,
                              selected_teeth: newSelectedTeeth
                            } : null);
                            const newTeethServices = { ...teethServices };
                            delete newTeethServices[parseInt(toothId)];
                            setTeethServices(newTeethServices);
                          }}
                          style={{
                            padding: '0.25rem 0.5rem',
                            backgroundColor: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.25rem',
                            cursor: 'pointer',
                            fontSize: '0.75rem'
                          }}
                        >
                          ❌ Убрать зуб
                        </button>
                      </div>
                      
                      {/* Список услуг для зуба */}
                      <div style={{ marginBottom: '0.5rem' }}>
                        {toothServices.length > 0 ? (
                          <ul style={{
                            listStyle: 'none',
                            margin: 0,
                            padding: 0,
                            display: 'grid',
                            gap: '4px'
                          }}>
                            {toothServices.map((service) => (
                              <li key={service.id} style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                border: '1px solid #e5e7eb',
                                borderRadius: '0.25rem',
                                padding: '0.4rem 0.5rem',
                                backgroundColor: '#fafafa'
                              }}>
                                <span style={{ color: '#374151' }}>{service.name}</span>
                                <span style={{ color: '#059669', fontWeight: 600 }}>{Number(service.price).toLocaleString()} ₸</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Услуги не назначены</div>
                        )}
                      </div>
                      {/* Итог по зубу */}
                      <div style={{
                        textAlign: 'right',
                        fontWeight: '600',
                        color: '#059669',
                        fontSize: '0.9rem'
                      }}>
                        Итого для зуба: {toothTotalCost.toLocaleString()} ₸
                      </div>
                    </div>
                  );
                })}
                
                {Object.keys(teethServices).length === 0 && (
                  <div style={{ 
                    textAlign: 'center', 
                    color: '#6b7280', 
                    fontSize: '0.875rem',
                    padding: '1rem'
                  }}>
                    Выберите зуб и добавьте к нему услуги
                  </div>
                )}
              </div>
            </div>

            <div style={{ 
              backgroundColor: '#f9fafb', 
              padding: '0.5rem', 
              borderRadius: '0.25rem', 
              marginBottom: '1rem',
              border: '1px solid #e5e7eb'
            }}>
              <h4 style={{ margin: '0 0 0.25rem 0', fontSize: 'clamp(0.875rem, 3vw, 1rem)', color: '#374151' }}>
                💡 Рекомендации по заполнению:
              </h4>
              <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)', color: '#6b7280' }}>
                <li>Диагноз должен быть точным и понятным</li>
                <li>Выберите зубы, требующие лечения, на карте зубов</li>
                <li>Для каждого зуба выберите необходимые услуги</li>
                <li>В описании лечения укажите все этапы и процедуры</li>
                <li>После заполнения плана можно создать запись на прием</li>
                <li>Статус "Активен" для текущих планов</li>
                <li>Статус "Завершен" для выполненных планов</li>
              </ul>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              {/* Кнопка создания записи на основе плана лечения */}
              {Object.keys(teethServices).length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    console.log('📅 Создание записи на основе плана лечения:', editingTreatmentPlan);
                    console.log('🦷 Услуги для зубов:', teethServices);
                    
                    // Закрываем модальное окно плана лечения
                    setShowTreatmentPlanModal(false);
                    setEditingTreatmentPlan(null);
                    setIsCreatingTreatmentPlan(false);
                    
                    // Переключаемся на календарь для создания записи
                    setActiveTab('calendar');
                    
                    // Показываем уведомление
                    alert('📅 Теперь выберите дату и время в календаре для создания записи на основе плана лечения!');
                  }}
                  style={{
                    backgroundColor: '#2563eb',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.25rem',
                    cursor: 'pointer',
                    fontSize: 'clamp(0.875rem, 3vw, 1rem)',
                    fontWeight: '500'
                  }}
                >
                  📅 Создать запись на основе плана
                </button>
              )}
              
              <button
                onClick={() => {
                  setShowTreatmentPlanModal(false);
                  setEditingTreatmentPlan(null);
                  setIsCreatingTreatmentPlan(false);
                }}
                style={{
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.25rem',
                  cursor: 'pointer',
                  fontSize: 'clamp(0.875rem, 3vw, 1rem)'
                }}
              >
                Отмена
              </button>
              <button
                onClick={saveTreatmentPlan}
                style={{
                  backgroundColor: '#059669',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.25rem',
                  cursor: 'pointer',
                  fontSize: 'clamp(0.875rem, 3vw, 1rem)'
                }}
              >
                {isCreatingTreatmentPlan ? 'Создать' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
        )}

        {activeTab === 'calendar' && (
          <CalendarSwitcher
            doctorId={1}
            onNavigateToTreatmentPlan={handleNavigateToTreatmentPlan}
            onCreateTreatmentPlan={handleCreateTreatmentPlanFromModal}
          />
        )}
    </div>
    </>
  );
};

export default Doctor;

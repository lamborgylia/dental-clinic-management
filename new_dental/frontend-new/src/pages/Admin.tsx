import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import EnhancedTable from '../components/EnhancedTable';

interface User {
  id: number;
  full_name: string;
  phone: string;
  role: string;
  clinic_id: number | null;
  is_active: boolean;
}

interface Clinic {
  id: number;
  name: string;
  address: string;
  contacts: string;
  is_active: boolean;
}

interface Patient {
  id: number;
  full_name: string;
  phone: string;
  iin: string;
  birth_date: string;
  allergies?: string;
  chronic_diseases?: string;
  contraindications?: string;
  special_notes?: string;
}


const Admin: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Основные данные
  const [users, setUsers] = useState<User[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  
  // Состояние UI
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'clinics' | 'patients'>('overview');
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  
  // Модальные окна (закомментированы неиспользуемые)
  // const [editingUser, setEditingUser] = useState<User | null>(null);
  // const [editingClinic, setEditingClinic] = useState<Clinic | null>(null);
  // const [showUserModal, setShowUserModal] = useState(false);
  // const [showClinicModal, setShowClinicModal] = useState(false);
  // const [isCreatingUser, setIsCreatingUser] = useState(false);
  // const [isCreatingClinic, setIsCreatingClinic] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  // Обработка параметра tab из URL
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['overview', 'users', 'clinics', 'patients'].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
  }, [searchParams]);

  // Фильтрация пациентов
  useEffect(() => {
    if (!patientSearchQuery.trim()) {
      setFilteredPatients(patients);
    } else {
      const filtered = patients.filter(patient =>
        patient.full_name.toLowerCase().includes(patientSearchQuery.toLowerCase()) ||
        patient.phone.includes(patientSearchQuery) ||
        patient.iin.includes(patientSearchQuery)
      );
      setFilteredPatients(filtered);
    }
  }, [patients, patientSearchQuery]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, clinicsRes, patientsRes] = await Promise.all([
        api.get('/users/'),
        api.get('/clinics/'),
        api.get('/patients/')
      ]);
      
      setUsers(usersRes.data || []);
      setClinics(clinicsRes.data || []);
      setPatients(patientsRes.data || []);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId: number, currentStatus: boolean) => {
    try {
      await api.put(`/users/${userId}`, {
        is_active: !currentStatus
      });
      await fetchData();
    } catch (error) {
      console.error('Ошибка обновления статуса пользователя:', error);
    }
  };

  const toggleClinicStatus = async (clinicId: number, currentStatus: boolean) => {
    try {
      await api.put(`/clinics/${clinicId}`, {
        is_active: !currentStatus
      });
      await fetchData();
    } catch (error) {
      console.error('Ошибка обновления статуса клиники:', error);
    }
  };

  // Функции редактирования удалены, так как модальные окна не используются
  // const handleEditUser = (user: User) => {
  //   setEditingUser(user);
  //   setIsCreatingUser(false);
  //   setShowUserModal(true);
  // };

  // const handleEditClinic = (clinic: Clinic) => {
  //   setEditingClinic(clinic);
  //   setIsCreatingClinic(false);
  //   setShowClinicModal(true);
  // };

  const openClinicSettings = (clinic: Clinic) => {
    navigate(`/clinic/${clinic.id}/edit`);
  };

  const tabs = [
    { id: 'overview', label: 'Обзор', icon: '📊' },
    { id: 'users', label: 'Пользователи', icon: '👥' },
    { id: 'clinics', label: 'Клиники', icon: '🏥' },
    { id: 'patients', label: 'Пациенты', icon: '👤' }
  ];

  const renderOverview = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
          <span style={{ fontSize: '2rem', marginRight: '0.75rem' }}>👥</span>
          <h3 style={{ margin: 0, color: '#1f2937' }}>Пользователи</h3>
        </div>
        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#059669', marginBottom: '0.5rem' }}>
          {users.length}
        </div>
        <div style={{ color: '#6b7280' }}>
          Активных: {users.filter(u => u.is_active).length}
        </div>
      </div>

      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
          <span style={{ fontSize: '2rem', marginRight: '0.75rem' }}>🏥</span>
          <h3 style={{ margin: 0, color: '#1f2937' }}>Клиники</h3>
        </div>
        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#059669', marginBottom: '0.5rem' }}>
          {clinics.length}
        </div>
        <div style={{ color: '#6b7280' }}>
          Активных: {clinics.filter(c => c.is_active).length}
        </div>
      </div>

      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
          <span style={{ fontSize: '2rem', marginRight: '0.75rem' }}>👤</span>
          <h3 style={{ margin: 0, color: '#1f2937' }}>Пациенты</h3>
        </div>
        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#059669', marginBottom: '0.5rem' }}>
          {patients.length}
        </div>
        <div style={{ color: '#6b7280' }}>
          Всего зарегистрировано
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      
      case 'users':
        return (
          <EnhancedTable
            columns={[
              { key: 'full_name', label: 'ФИО', width: '25%' },
              { key: 'phone', label: 'Телефон', width: '20%' },
              { key: 'role', label: 'Роль', width: '15%', render: (value) => (
                <span style={{
                  padding: '0.25rem 0.5rem',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  backgroundColor: value === 'admin' ? '#fef3c7' : value === 'doctor' ? '#dbeafe' : '#f3f4f6',
                  color: value === 'admin' ? '#92400e' : value === 'doctor' ? '#1e40af' : '#374151'
                }}>
                  {value === 'admin' ? 'Администратор' : value === 'doctor' ? 'Врач' : value === 'nurse' ? 'Медсестра' : 'Регистратор'}
                </span>
              )},
              { key: 'clinic_id', label: 'Клиника', width: '20%', render: (value) => {
                const clinic = clinics.find(c => c.id === value);
                return clinic ? clinic.name : 'Не назначена';
              }},
              { key: 'is_active', label: 'Статус', width: '10%', render: (value) => (
                <span style={{
                  padding: '0.25rem 0.5rem',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  backgroundColor: value ? '#dcfce7' : '#fee2e2',
                  color: value ? '#166534' : '#dc2626'
                }}>
                  {value ? 'Активен' : 'Заблокирован'}
                </span>
              )}
            ]}
            data={users}
            loading={loading}
            emptyMessage="Нет пользователей"
            actions={(user) => (
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    alert('Функция редактирования пользователя будет добавлена позже');
                  }}
                  style={{
                    padding: '0.25rem 0.5rem',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  ✏️
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleUserStatus(user.id, user.is_active);
                  }}
                  style={{
                    padding: '0.25rem 0.5rem',
                    backgroundColor: user.is_active ? '#ef4444' : '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  {user.is_active ? '🚫' : '✅'}
                </button>
              </div>
            )}
          />
        );

      case 'clinics':
        return (
          <EnhancedTable
            columns={[
              { key: 'name', label: 'Название', width: '30%' },
              { key: 'address', label: 'Адрес', width: '35%' },
              { key: 'contacts', label: 'Контакты', width: '25%' },
              { key: 'is_active', label: 'Статус', width: '10%', render: (value) => (
                <span style={{
                  padding: '0.25rem 0.5rem',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  backgroundColor: value ? '#dcfce7' : '#fee2e2',
                  color: value ? '#166534' : '#dc2626'
                }}>
                  {value ? 'Активна' : 'Неактивна'}
                </span>
              )}
            ]}
            data={clinics}
            loading={loading}
            emptyMessage="Нет клиник"
            actions={(clinic) => (
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    alert('Функция редактирования клиники будет добавлена позже');
                  }}
                  style={{
                    padding: '0.25rem 0.5rem',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  ✏️
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openClinicSettings(clinic);
                  }}
                  style={{
                    padding: '0.25rem 0.5rem',
                    backgroundColor: '#059669',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  ⚙️
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleClinicStatus(clinic.id, clinic.is_active);
                  }}
                  style={{
                    padding: '0.25rem 0.5rem',
                    backgroundColor: clinic.is_active ? '#ef4444' : '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  {clinic.is_active ? '🚫' : '✅'}
                </button>
              </div>
            )}
          />
        );

      case 'patients':
        return (
          <div>
            {/* Поиск пациентов */}
            <div style={{ marginBottom: '1.5rem' }}>
              <input
                type="text"
                value={patientSearchQuery}
                onChange={(e) => setPatientSearchQuery(e.target.value)}
                placeholder="Поиск пациентов по имени, телефону или ИИН..."
                style={{
                  width: '100%',
                  maxWidth: '500px',
                  padding: '0.75rem 1rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#059669';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                }}
              />
            </div>

            <EnhancedTable
              columns={[
                { key: 'full_name', label: 'ФИО', width: '25%' },
                { key: 'phone', label: 'Телефон', width: '20%' },
                { key: 'iin', label: 'ИИН', width: '15%' },
                { key: 'birth_date', label: 'Дата рождения', width: '15%', render: (value) => 
                  value ? new Date(value).toLocaleDateString('ru-RU') : '-'
                },
                { key: 'allergies', label: 'Аллергии', width: '25%', render: (value) => 
                  value || 'Не указаны'
                }
              ]}
              data={filteredPatients}
              loading={loading}
              emptyMessage={patientSearchQuery ? "Пациенты не найдены" : "Нет пациентов"}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Заголовок */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '1rem', color: '#1f2937' }}>Административная панель</h1>
        <p style={{ color: '#6b7280', fontSize: '1rem' }}>
          Управление пользователями, клиниками и пациентами системы
        </p>
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
            onClick={() => setActiveTab(tab.id as any)}
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
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== tab.id) {
                e.currentTarget.style.backgroundColor = '#e5e7eb';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== tab.id) {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
              }
            }}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Содержимое вкладки */}
      {renderTabContent()}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Admin;
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';

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

const Admin: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [users, setUsers] = useState<User[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'clinics'>('users');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingClinic, setEditingClinic] = useState<Clinic | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showClinicModal, setShowClinicModal] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isCreatingClinic, setIsCreatingClinic] = useState(false);
  const [showClinicSettings, setShowClinicSettings] = useState(false);
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  const [clinicSettingsTab, setClinicSettingsTab] = useState<'staff' | 'services' | 'homepage' | 'appointments' | 'treatment_plans'>('staff');
  const [clinicStaff, setClinicStaff] = useState<User[]>([]);
  const [editingStaff, setEditingStaff] = useState<User | null>(null);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [isCreatingStaff, setIsCreatingStaff] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  // Обработка параметра tab из URL
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['users', 'clinics'].includes(tabParam)) {
      setActiveTab(tabParam as 'users' | 'clinics');
    }
  }, [searchParams]);

  const fetchData = async () => {
    try {
      const [usersRes, clinicsRes] = await Promise.all([
        api.get('/users/'),
        api.get('/clinics/')
      ]);
      setUsers(usersRes.data);
      setClinics(clinicsRes.data);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const toggleUserStatus = async (userId: number, currentStatus: boolean) => {
    try {
      await api.put(`/users/${userId}`, {
        is_active: !currentStatus
      });
      await fetchData(); // Обновляем данные
    } catch (error) {
      console.error('Ошибка обновления статуса пользователя:', error);
    }
  };

  const toggleClinicStatus = async (clinicId: number, currentStatus: boolean) => {
    try {
      await api.put(`/clinics/${clinicId}`, {
        is_active: !currentStatus
      });
      await fetchData(); // Обновляем данные
    } catch (error) {
      console.error('Ошибка обновления статуса клиники:', error);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsCreatingUser(false);
    setShowUserModal(true);
  };

  const handleEditClinic = (clinic: Clinic) => {
    setEditingClinic(clinic);
    setIsCreatingClinic(false);
    setShowClinicModal(true);
  };

  const handleCreateUser = () => {
    setEditingUser({
      id: 0,
      full_name: '',
      phone: '',
      role: 'patient',
      clinic_id: null,
      is_active: true
    });
    setIsCreatingUser(true);
    setShowUserModal(true);
  };

  const handleCreateClinic = () => {
    setEditingClinic({
      id: 0,
      name: '',
      address: '',
      contacts: '',
      is_active: true
    });
    setIsCreatingClinic(true);
    setShowClinicModal(true);
  };

  const openClinicSettings = (clinic: Clinic) => {
    setSelectedClinic(clinic);
    setClinicSettingsTab('staff');
    setShowClinicSettings(true);
    fetchClinicStaff(clinic.id);
  };

  const fetchClinicStaff = async (clinicId: number) => {
    try {
      const response = await api.get(`/users/?clinic_id=${clinicId}`);
      setClinicStaff(response.data);
      console.log(`Загружен персонал клиники ${clinicId}:`, response.data);
    } catch (error) {
      console.error('Error fetching clinic staff:', error);
      setClinicStaff([]);
    }
  };

  const handleCreateStaff = () => {
    if (!selectedClinic) return;
    setEditingStaff({
      id: 0,
      full_name: '',
      phone: '',
      role: 'doctor',
      clinic_id: selectedClinic.id,
      is_active: true
    });
    setIsCreatingStaff(true);
    setShowStaffModal(true);
  };

  const handleEditStaff = (staff: User) => {
    setEditingStaff(staff);
    setIsCreatingStaff(false);
    setShowStaffModal(true);
  };

  const saveStaff = async () => {
    if (!editingStaff || !selectedClinic) return;
    try {
      if (isCreatingStaff) {
        await api.post('/users/', {
          full_name: editingStaff.full_name,
          phone: editingStaff.phone,
          role: editingStaff.role,
          clinic_id: selectedClinic.id,
          password: '1234'
        });
      } else {
        await api.put(`/users/${editingStaff.id}`, {
          full_name: editingStaff.full_name,
          phone: editingStaff.phone,
          role: editingStaff.role
        });
      }
      setShowStaffModal(false);
      setEditingStaff(null);
      fetchClinicStaff(selectedClinic.id);
    } catch (error) {
      console.error('Error saving staff:', error);
    }
  };

  const toggleStaffStatus = async (staffId: number, currentStatus: boolean) => {
    try {
      await api.put(`/users/${staffId}`, {
        is_active: !currentStatus
      });
      if (selectedClinic) {
        fetchClinicStaff(selectedClinic.id);
      }
    } catch (error) {
      console.error('Error toggling staff status:', error);
    }
  };

  const saveUser = async () => {
    if (!editingUser) return;
    try {
      if (isCreatingUser) {
        await api.post('/users/', {
          full_name: editingUser.full_name,
          phone: editingUser.phone,
          role: editingUser.role,
          password: '1234' // Пароль по умолчанию
        });
      } else {
        await api.put(`/users/${editingUser.id}`, {
          full_name: editingUser.full_name,
          phone: editingUser.phone,
          role: editingUser.role
        });
      }
      setShowUserModal(false);
      setEditingUser(null);
      setIsCreatingUser(false);
      await fetchData();
    } catch (error) {
      console.error('Ошибка сохранения пользователя:', error);
    }
  };

  const saveClinic = async () => {
    if (!editingClinic) return;
    try {
      if (isCreatingClinic) {
        await api.post('/clinics/', {
          name: editingClinic.name,
          address: editingClinic.address,
          contacts: editingClinic.contacts
        });
      } else {
        await api.put(`/clinics/${editingClinic.id}`, {
          name: editingClinic.name,
          address: editingClinic.address,
          contacts: editingClinic.contacts
        });
      }
      setShowClinicModal(false);
      setEditingClinic(null);
      setIsCreatingClinic(false);
      await fetchData();
    } catch (error) {
      console.error('Ошибка сохранения клиники:', error);
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
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>


      {/* Content */}
      <div style={{ padding: 'clamp(0.5rem, 2vw, 2rem)', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
        {activeTab === 'users' && (
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
              }}>Пользователи</h2>
              <button
                onClick={handleCreateUser}
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
                + Добавить пользователя
              </button>
            </div>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              overflow: 'auto',
              width: '100%',
              maxWidth: '100%'
            }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse',
                minWidth: '800px'
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
                    }}>Роль</th>
                    <th style={{ 
                      padding: 'clamp(0.5rem, 2vw, 1rem)', 
                      textAlign: 'left', 
                      borderBottom: '1px solid #e5e7eb',
                      fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
                      minWidth: '100px'
                    }}>Статус</th>
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
                  {users.map(user => (
                    <tr key={user.id}>
                      <td style={{ 
                        padding: 'clamp(0.5rem, 2vw, 1rem)', 
                        borderBottom: '1px solid #e5e7eb',
                        fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)'
                      }}>{user.id}</td>
                      <td style={{ 
                        padding: 'clamp(0.5rem, 2vw, 1rem)', 
                        borderBottom: '1px solid #e5e7eb',
                        fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
                        fontWeight: '500'
                      }}>{user.full_name}</td>
                      <td style={{ 
                        padding: 'clamp(0.5rem, 2vw, 1rem)', 
                        borderBottom: '1px solid #e5e7eb',
                        fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
                        whiteSpace: 'nowrap'
                      }}>{user.phone}</td>
                      <td style={{ 
                        padding: 'clamp(0.5rem, 2vw, 1rem)', 
                        borderBottom: '1px solid #e5e7eb',
                        fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)'
                      }}>{user.role}</td>
                      <td style={{ 
                        padding: 'clamp(0.5rem, 2vw, 1rem)', 
                        borderBottom: '1px solid #e5e7eb',
                        fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)'
                      }}>
                        <span style={{
                          backgroundColor: user.is_active ? '#dcfce7' : '#fef2f2',
                          color: user.is_active ? '#166534' : '#dc2626',
                          padding: 'clamp(0.25rem, 1vw, 0.5rem)',
                          borderRadius: '0.25rem',
                          fontSize: 'clamp(0.7rem, 2vw, 0.875rem)',
                          whiteSpace: 'nowrap'
                        }}>
                          {user.is_active ? 'Активен' : 'Неактивен'}
                        </span>
                      </td>
                      <td style={{ 
                        padding: 'clamp(0.5rem, 2vw, 1rem)', 
                        borderBottom: '1px solid #e5e7eb',
                        fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)'
                      }}>
                        <div style={{ 
                          display: 'flex', 
                          gap: 'clamp(0.25rem, 1vw, 0.5rem)',
                          flexWrap: 'wrap',
                          justifyContent: 'flex-start'
                        }}>
                          <button
                            onClick={() => handleEditUser(user)}
                            style={{
                              backgroundColor: '#2563eb',
                              color: 'white',
                              border: 'none',
                              padding: 'clamp(0.25rem, 1vw, 0.5rem)',
                              borderRadius: '0.25rem',
                              cursor: 'pointer',
                              fontSize: 'clamp(0.7rem, 2vw, 0.75rem)',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            Редактировать
                          </button>
                          <button
                            onClick={() => toggleUserStatus(user.id, user.is_active)}
                            style={{
                              backgroundColor: user.is_active ? '#dc2626' : '#059669',
                              color: 'white',
                              border: 'none',
                              padding: 'clamp(0.25rem, 1vw, 0.5rem)',
                              borderRadius: '0.25rem',
                              cursor: 'pointer',
                              fontSize: 'clamp(0.7rem, 2vw, 0.75rem)',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {user.is_active ? 'Деактивировать' : 'Активировать'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'clinics' && (
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
              }}>Клиники</h2>
              <button
                onClick={handleCreateClinic}
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
                + Добавить клинику
              </button>
            </div>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              overflow: 'auto',
              width: '100%',
              maxWidth: '100%'
            }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse',
                minWidth: '900px'
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
                      minWidth: '200px'
                    }}>Название</th>
                    <th style={{ 
                      padding: 'clamp(0.5rem, 2vw, 1rem)', 
                      textAlign: 'left', 
                      borderBottom: '1px solid #e5e7eb',
                      fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
                      minWidth: '250px'
                    }}>Адрес</th>
                    <th style={{ 
                      padding: 'clamp(0.5rem, 2vw, 1rem)', 
                      textAlign: 'left', 
                      borderBottom: '1px solid #e5e7eb',
                      fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
                      minWidth: '150px'
                    }}>Контакты</th>
                    <th style={{ 
                      padding: 'clamp(0.5rem, 2vw, 1rem)', 
                      textAlign: 'left', 
                      borderBottom: '1px solid #e5e7eb',
                      fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
                      minWidth: '100px'
                    }}>Статус</th>
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
                  {clinics.map(clinic => (
                    <tr key={clinic.id}>
                      <td style={{ 
                        padding: 'clamp(0.5rem, 2vw, 1rem)', 
                        borderBottom: '1px solid #e5e7eb',
                        fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)'
                      }}>{clinic.id}</td>
                      <td style={{ 
                        padding: 'clamp(0.5rem, 2vw, 1rem)', 
                        borderBottom: '1px solid #e5e7eb',
                        fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
                        fontWeight: '500',
                        maxWidth: '200px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>{clinic.name}</td>
                      <td style={{ 
                        padding: 'clamp(0.5rem, 2vw, 1rem)', 
                        borderBottom: '1px solid #e5e7eb',
                        fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
                        maxWidth: '250px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>{clinic.address}</td>
                      <td style={{ 
                        padding: 'clamp(0.5rem, 2vw, 1rem)', 
                        borderBottom: '1px solid #e5e7eb',
                        fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
                        maxWidth: '150px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>{clinic.contacts}</td>
                      <td style={{ 
                        padding: 'clamp(0.5rem, 2vw, 1rem)', 
                        borderBottom: '1px solid #e5e7eb',
                        fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)'
                      }}>
                        <span style={{
                          backgroundColor: clinic.is_active ? '#dcfce7' : '#fef2f2',
                          color: clinic.is_active ? '#166534' : '#dc2626',
                          padding: 'clamp(0.25rem, 1vw, 0.5rem)',
                          borderRadius: '0.25rem',
                          fontSize: 'clamp(0.7rem, 2vw, 0.875rem)',
                          whiteSpace: 'nowrap'
                        }}>
                          {clinic.is_active ? 'Активна' : 'Неактивна'}
                        </span>
                      </td>
                      <td style={{ 
                        padding: 'clamp(0.5rem, 2vw, 1rem)', 
                        borderBottom: '1px solid #e5e7eb',
                        fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)'
                      }}>
                        <div style={{ 
                          display: 'flex', 
                          gap: 'clamp(0.25rem, 1vw, 0.5rem)',
                          flexWrap: 'wrap',
                          justifyContent: 'flex-start'
                        }}>
                          <button
                            onClick={() => handleEditClinic(clinic)}
                            style={{
                              backgroundColor: '#2563eb',
                              color: 'white',
                              border: 'none',
                              padding: 'clamp(0.25rem, 1vw, 0.5rem)',
                              borderRadius: '0.25rem',
                              cursor: 'pointer',
                              fontSize: 'clamp(0.7rem, 2vw, 0.75rem)',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            Редактировать
                          </button>
                          <button
                            onClick={() => toggleClinicStatus(clinic.id, clinic.is_active)}
                            style={{
                              backgroundColor: clinic.is_active ? '#dc2626' : '#059669',
                              color: 'white',
                              border: 'none',
                              padding: 'clamp(0.25rem, 1vw, 0.5rem)',
                              borderRadius: '0.25rem',
                              cursor: 'pointer',
                              fontSize: 'clamp(0.7rem, 2vw, 0.75rem)',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {clinic.is_active ? 'Деактивировать' : 'Активировать'}
                          </button>
                          <button
                            onClick={() => openClinicSettings(clinic)}
                            style={{
                              backgroundColor: '#7c3aed',
                              color: 'white',
                              border: 'none',
                              padding: 'clamp(0.25rem, 1vw, 0.5rem)',
                              borderRadius: '0.25rem',
                              cursor: 'pointer',
                              fontSize: 'clamp(0.7rem, 2vw, 0.75rem)',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            Настройки
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* User Edit Modal */}
      {showUserModal && editingUser && (
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
            width: '400px',
            maxWidth: '90vw'
          }}>
            <h3>{isCreatingUser ? 'Создать пользователя' : 'Редактировать пользователя'}</h3>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Имя:</label>
              <input
                type="text"
                value={editingUser.full_name}
                onChange={(e) => setEditingUser({...editingUser, full_name: e.target.value})}
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
                value={editingUser.phone}
                onChange={(e) => setEditingUser({...editingUser, phone: e.target.value})}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.25rem'
                }}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Роль:</label>
              <select
                value={editingUser.role}
                onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.25rem'
                }}
              >
                <option value="admin">Админ</option>
                <option value="doctor">Врач</option>
                <option value="nurse">Медсестра</option>
                <option value="registrar">Регистратор</option>
                <option value="patient">Пациент</option>
              </select>
            </div>
            {isCreatingUser && (
              <div style={{ marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#fef3c7', borderRadius: '0.25rem' }}>
                <small style={{ color: '#92400e' }}>
                  Пароль по умолчанию: <strong>1234</strong>
                </small>
              </div>
            )}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowUserModal(false);
                  setEditingUser(null);
                  setIsCreatingUser(false);
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
                onClick={saveUser}
                style={{
                  backgroundColor: '#059669',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.25rem',
                  cursor: 'pointer'
                }}
              >
                {isCreatingUser ? 'Создать' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clinic Edit Modal */}
      {showClinicModal && editingClinic && (
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
            width: '400px',
            maxWidth: '90vw'
          }}>
            <h3>{isCreatingClinic ? 'Создать клинику' : 'Редактировать клинику'}</h3>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Название:</label>
              <input
                type="text"
                value={editingClinic.name}
                onChange={(e) => setEditingClinic({...editingClinic, name: e.target.value})}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.25rem'
                }}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Адрес:</label>
              <input
                type="text"
                value={editingClinic.address}
                onChange={(e) => setEditingClinic({...editingClinic, address: e.target.value})}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.25rem'
                }}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Контакты:</label>
              <input
                type="text"
                value={editingClinic.contacts}
                onChange={(e) => setEditingClinic({...editingClinic, contacts: e.target.value})}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.25rem'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowClinicModal(false);
                  setEditingClinic(null);
                  setIsCreatingClinic(false);
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
                onClick={saveClinic}
                style={{
                  backgroundColor: '#059669',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.25rem',
                  cursor: 'pointer'
                }}
              >
                {isCreatingClinic ? 'Создать' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clinic Settings Modal */}
      {showClinicSettings && selectedClinic && (
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
            borderRadius: '0.5rem',
            padding: '2rem',
            width: '90%',
            maxWidth: '1200px',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '2rem',
              borderBottom: '1px solid #e5e7eb',
              paddingBottom: '1rem'
            }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>
                Настройки клиники: {selectedClinic.name}
              </h2>
              <button
                onClick={() => setShowClinicSettings(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                ×
              </button>
            </div>

            {/* Navigation Tabs */}
            <div style={{
              display: 'flex',
              gap: '1rem',
              marginBottom: '2rem',
              borderBottom: '1px solid #e5e7eb',
              flexWrap: 'wrap'
            }}>
              {[
                { key: 'staff', label: 'Персонал' },
                { key: 'services', label: 'Услуги' },
                { key: 'homepage', label: 'Главная страница' },
                { key: 'appointments', label: 'Записи на прием' },
                { key: 'treatment_plans', label: 'Планы лечения' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setClinicSettingsTab(tab.key as any)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: 'none',
                    backgroundColor: clinicSettingsTab === tab.key ? '#3b82f6' : '#f3f4f6',
                    color: clinicSettingsTab === tab.key ? 'white' : '#374151',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div style={{ minHeight: '400px' }}>
              {clinicSettingsTab === 'staff' && (
                <div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem'
                  }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem' }}>
                      Управление персоналом 
                      <span style={{
                        backgroundColor: '#e5e7eb',
                        color: '#374151',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        marginLeft: '0.5rem'
                      }}>
                        {clinicStaff.length} сотрудников
                      </span>
                    </h3>
                    <button
                      onClick={handleCreateStaff}
                      style={{
                        backgroundColor: '#059669',
                        color: 'white',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '0.25rem',
                        cursor: 'pointer'
                      }}
                    >
                      + Добавить сотрудника
                    </button>
                  </div>
                  
                  {clinicStaff.length === 0 ? (
                    <div style={{
                      backgroundColor: 'white',
                      borderRadius: '0.5rem',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                      padding: '3rem',
                      textAlign: 'center',
                      border: '2px dashed #d1d5db'
                    }}>
                      <div style={{
                        fontSize: '3rem',
                        marginBottom: '1rem',
                        color: '#9ca3af'
                      }}>👥</div>
                      <h3 style={{
                        fontSize: '1.25rem',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '0.5rem'
                      }}>
                        Персонал не найден
                      </h3>
                      <p style={{
                        color: '#6b7280',
                        marginBottom: '1.5rem'
                      }}>
                        В этой клинике пока нет сотрудников. Добавьте первого сотрудника, чтобы начать работу.
                      </p>
                      <button
                        onClick={handleCreateStaff}
                        style={{
                          backgroundColor: '#059669',
                          color: 'white',
                          border: 'none',
                          padding: '0.75rem 1.5rem',
                          borderRadius: '0.5rem',
                          cursor: 'pointer',
                          fontSize: '1rem',
                          fontWeight: '500'
                        }}
                      >
                        + Добавить первого сотрудника
                      </button>
                    </div>
                  ) : (
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
                        minWidth: '600px'
                      }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f9fafb' }}>
                            <th style={{ 
                              padding: 'clamp(0.5rem, 2vw, 1rem)', 
                              textAlign: 'left', 
                              fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
                              fontWeight: '600',
                              minWidth: '40px'
                            }}>ID</th>
                            <th style={{ 
                              padding: 'clamp(0.5rem, 2vw, 1rem)', 
                              textAlign: 'left', 
                              fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
                              fontWeight: '600',
                              minWidth: '150px'
                            }}>Имя</th>
                            <th style={{ 
                              padding: 'clamp(0.5rem, 2vw, 1rem)', 
                              textAlign: 'left', 
                              fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
                              fontWeight: '600',
                              minWidth: '120px'
                            }}>Телефон</th>
                            <th style={{ 
                              padding: 'clamp(0.5rem, 2vw, 1rem)', 
                              textAlign: 'left', 
                              fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
                              fontWeight: '600',
                              minWidth: '100px'
                            }}>Роль</th>
                            <th style={{ 
                              padding: 'clamp(0.5rem, 2vw, 1rem)', 
                              textAlign: 'left', 
                              fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
                              fontWeight: '600',
                              minWidth: '100px'
                            }}>Статус</th>
                            <th style={{ 
                              padding: 'clamp(0.5rem, 2vw, 1rem)', 
                              textAlign: 'left', 
                              fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
                              fontWeight: '600',
                              minWidth: '120px'
                            }}>Действия</th>
                          </tr>
                        </thead>
                        <tbody>
                          {clinicStaff.map((staff) => (
                            <tr key={staff.id}>
                              <td style={{ 
                                padding: 'clamp(0.5rem, 2vw, 1rem)', 
                                borderBottom: '1px solid #e5e7eb',
                                fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
                                whiteSpace: 'nowrap'
                              }}>{staff.id}</td>
                              <td style={{ 
                                padding: 'clamp(0.5rem, 2vw, 1rem)', 
                                borderBottom: '1px solid #e5e7eb',
                                fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
                                maxWidth: '150px',
                                wordWrap: 'break-word',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}>{staff.full_name}</td>
                              <td style={{ 
                                padding: 'clamp(0.5rem, 2vw, 1rem)', 
                                borderBottom: '1px solid #e5e7eb',
                                fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
                                whiteSpace: 'nowrap'
                              }}>{staff.phone}</td>
                              <td style={{ 
                                padding: 'clamp(0.5rem, 2vw, 1rem)', 
                                borderBottom: '1px solid #e5e7eb',
                                fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
                                whiteSpace: 'nowrap'
                              }}>{staff.role}</td>
                              <td style={{ 
                                padding: 'clamp(0.5rem, 2vw, 1rem)', 
                                borderBottom: '1px solid #e5e7eb',
                                fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)'
                              }}>
                                <span style={{
                                  backgroundColor: staff.is_active ? '#dcfce7' : '#fef2f2',
                                  color: staff.is_active ? '#166534' : '#dc2626',
                                  padding: 'clamp(0.25rem, 1vw, 0.5rem)',
                                  borderRadius: '0.25rem',
                                  fontSize: 'clamp(0.7rem, 2vw, 0.875rem)',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {staff.is_active ? 'Активен' : 'Неактивен'}
                                </span>
                              </td>
                              <td style={{ 
                                padding: 'clamp(0.5rem, 2vw, 1rem)', 
                                borderBottom: '1px solid #e5e7eb',
                                fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)'
                              }}>
                                <div style={{ 
                                  display: 'flex', 
                                  gap: 'clamp(0.25rem, 1vw, 0.5rem)',
                                  flexWrap: 'wrap',
                                  justifyContent: 'flex-start'
                                }}>
                                  <button
                                    onClick={() => handleEditStaff(staff)}
                                    style={{
                                      backgroundColor: '#2563eb',
                                      color: 'white',
                                      border: 'none',
                                      padding: 'clamp(0.25rem, 1vw, 0.5rem)',
                                      borderRadius: '0.25rem',
                                      cursor: 'pointer',
                                      fontSize: 'clamp(0.7rem, 2vw, 0.75rem)',
                                      whiteSpace: 'nowrap'
                                    }}
                                  >
                                    Редактировать
                                  </button>
                                  <button
                                    onClick={() => toggleStaffStatus(staff.id, staff.is_active)}
                                    style={{
                                      backgroundColor: staff.is_active ? '#dc2626' : '#059669',
                                      color: 'white',
                                      border: 'none',
                                      padding: 'clamp(0.25rem, 1vw, 0.5rem)',
                                      borderRadius: '0.25rem',
                                      cursor: 'pointer',
                                      fontSize: 'clamp(0.7rem, 2vw, 0.75rem)',
                                      whiteSpace: 'nowrap'
                                    }}
                                  >
                                    {staff.is_active ? 'Деактивировать' : 'Активировать'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {clinicSettingsTab === 'services' && (
                <div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem'
                  }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Управление услугами</h3>
                    <button
                      style={{
                        backgroundColor: '#059669',
                        color: 'white',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '0.25rem',
                        cursor: 'pointer'
                      }}
                    >
                      + Добавить услугу
                    </button>
                  </div>
                  <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
                    Здесь будет управление услугами клиники: добавление, редактирование, удаление и настройка цен.
                  </p>
                </div>
              )}

              {clinicSettingsTab === 'homepage' && (
                <div>
                  <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem' }}>Настройки главной страницы</h3>
                  <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
                    Здесь будет управление информацией о клинике, врачах, контактах и другими данными для главной страницы.
                  </p>
                </div>
              )}

              {clinicSettingsTab === 'appointments' && (
                <div>
                  <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem' }}>Управление записями на прием</h3>
                  <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
                    Здесь будет просмотр и управление всеми записями на прием в клинике.
                  </p>
                </div>
              )}

              {clinicSettingsTab === 'treatment_plans' && (
                <div>
                  <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem' }}>Управление планами лечения</h3>
                  <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
                    Здесь будет просмотр и управление всеми планами лечения пациентов клиники.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Staff Modal */}
      {showStaffModal && editingStaff && (
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
          zIndex: 1001
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            padding: '2rem',
            width: '90%',
            maxWidth: '500px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.5rem', fontWeight: 'bold' }}>
              {isCreatingStaff ? 'Добавить сотрудника' : 'Редактировать сотрудника'}
            </h2>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Полное имя
              </label>
              <input
                type="text"
                value={editingStaff.full_name}
                onChange={(e) => setEditingStaff({...editingStaff, full_name: e.target.value})}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '1rem'
                }}
                placeholder="Введите полное имя"
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Телефон
              </label>
              <input
                type="tel"
                value={editingStaff.phone}
                onChange={(e) => setEditingStaff({...editingStaff, phone: e.target.value})}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '1rem'
                }}
                placeholder="Введите номер телефона"
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Роль
              </label>
              <select
                value={editingStaff.role}
                onChange={(e) => setEditingStaff({...editingStaff, role: e.target.value})}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '1rem'
                }}
              >
                <option value="doctor">Врач</option>
                <option value="nurse">Медсестра</option>
                <option value="registrar">Регистратор</option>
              </select>
            </div>

            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowStaffModal(false)}
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
                onClick={saveStaff}
                style={{
                  backgroundColor: '#059669',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.25rem',
                  cursor: 'pointer'
                }}
              >
                {isCreatingStaff ? 'Создать' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;

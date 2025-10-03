import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { authService } from './services/auth';
import { ClinicProvider, useClinic } from './contexts/ClinicContext';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import Admin from './pages/Admin';
import Doctor from './pages/Doctor';
import Patients from './pages/Patients';
import PatientDashboard from './pages/PatientDashboard';
import TreatmentOrders from './pages/TreatmentOrders';
import TreatmentOrderDetail from './pages/TreatmentOrderDetail';
import CreateTreatmentOrder from './pages/CreateTreatmentOrder';
import ClinicEdit from './pages/ClinicEdit';
import DebugPage from './pages/DebugPage';
import MobileAuth from './components/MobileAuth';

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({ 
  children, 
  allowedRoles 
}) => {
  const user = authService.getUser();
  const token = authService.getToken();
  
  console.log('🛡️ ProtectedRoute проверка:');
  console.log('👤 Пользователь:', user);
  console.log('🔑 Токен:', token ? 'ЕСТЬ' : 'НЕТ');
  console.log('🎭 Роль:', user?.role);
  console.log('✅ Разрешенные роли:', allowedRoles);
  
  if (!user || !token) {
    console.log('❌ Нет пользователя или токена, перенаправление на логин');
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    console.log('❌ Роль не разрешена, перенаправление на главную');
    return <Navigate to="/" replace />;
  }

  console.log('✅ Доступ разрешен');
  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const { clinic } = useClinic();
  const clinicName = clinic?.name || "DentalCare";

  return (
    <Routes>
      <Route path="/home" element={
        <Layout clinicName={clinicName}>
          <HomePage 
            clinicName={clinic?.name}
            clinicDescription={clinic?.description}
            clinicAddress={clinic?.address}
            clinicContacts={clinic?.contacts}
          />
        </Layout>
      } />
      <Route path="/login" element={<Login />} />
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Layout>
            <Admin />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/clinic/:clinicId/edit" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Layout clinicName={clinicName}>
            <ClinicEdit />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/doctor" element={
        <ProtectedRoute allowedRoles={['doctor', 'nurse']}>
          <Layout clinicName={clinicName}>
            <Doctor />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/patients" element={
        <ProtectedRoute allowedRoles={['registrar', 'patient']}>
          <Layout clinicName={clinicName}>
            <Patients />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/patient/:patientId" element={
        <ProtectedRoute allowedRoles={['doctor', 'nurse', 'admin', 'patient']}>
          <Layout clinicName={clinicName}>
            <PatientDashboard />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/treatment-orders" element={
        <ProtectedRoute allowedRoles={['doctor', 'nurse', 'admin']}>
          <Layout clinicName={clinicName}>
            <TreatmentOrders />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/treatment-orders/:id" element={
        <ProtectedRoute allowedRoles={['doctor', 'nurse', 'admin']}>
          <Layout clinicName={clinicName}>
            <TreatmentOrderDetail />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/treatment-orders/create" element={
        <ProtectedRoute allowedRoles={['doctor', 'nurse', 'admin']}>
          <Layout clinicName={clinicName}>
            <CreateTreatmentOrder />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/debug" element={<DebugPage />} />
      <Route path="/" element={<RoleBasedHome />} />
    </Routes>
  );
};

const RoleBasedHome: React.FC = () => {
  const user = authService.getUser();
  const token = authService.getToken();
  const { clinic } = useClinic();
  const clinicName = clinic?.name || "DentalCare";
  
  if (!user || !token) {
    return (
      <Layout clinicName={clinicName}>
        <HomePage 
          clinicName={clinic?.name}
          clinicDescription={clinic?.description}
          clinicAddress={clinic?.address}
          clinicContacts={clinic?.contacts}
        />
      </Layout>
    );
  }
  
  // Только админ попадает в админ-панель, все остальные на главную страницу
  if (user.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }
  
  // Все остальные пользователи (врач, медсестра, регистратор, пациент) попадают на главную страницу
  return (
    <Layout clinicName={clinicName}>
      <HomePage 
        clinicName={clinic?.name}
        clinicDescription={clinic?.description}
        clinicAddress={clinic?.address}
        clinicContacts={clinic?.contacts}
      />
    </Layout>
  );
};

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({
    phone: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Проверяем, мобильное ли это устройство
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authService.login(credentials);
      
      console.log('🔐 Ответ от сервера:', response);
      
      try {
        localStorage.setItem('access_token', response.access_token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        console.log('💾 Токен сохранен:', response.access_token);
        console.log('👤 Пользователь сохранен:', response.user);
        console.log('📱 User Agent:', navigator.userAgent);
        console.log('🌐 URL:', window.location.href);
        
        // Проверяем, что токен действительно сохранился
        const savedToken = localStorage.getItem('access_token');
        console.log('✅ Проверка сохранения токена:', savedToken ? 'УСПЕШНО' : 'ОШИБКА');
      } catch (error) {
        console.error('❌ Ошибка сохранения в localStorage:', error);
        setError('Ошибка сохранения данных авторизации');
        return;
      }
      
      navigate('/');
    } catch (err: any) {
      console.error('Ошибка входа:', err);
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (err.response?.data?.msg) {
        setError(err.response.data.msg);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Ошибка входа. Проверьте данные и попробуйте снова.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Если мобильное устройство, показываем специальный компонент
  if (isMobile) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', padding: '20px' }}>
        <MobileAuth onSuccess={() => navigate('/')} />
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <div style={{
          width: '48px',
          height: '48px',
          backgroundColor: '#2563eb',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1rem'
        }}>
          <svg style={{ width: '24px', height: '24px', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="title">Вход в систему</h2>
        <p className="subtitle">Стоматологическая клиника</p>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
              Телефон
            </label>
            <input
              type="tel"
              required
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                boxSizing: 'border-box'
              }}
              placeholder="+77771234567"
              value={credentials.phone}
              onChange={(e) => setCredentials({...credentials, phone: e.target.value})}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
              Пароль
            </label>
            <input
              type="password"
              required
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                boxSizing: 'border-box'
              }}
              placeholder="Пароль"
              value={credentials.password}
              onChange={(e) => setCredentials({...credentials, password: e.target.value})}
            />
          </div>

          {error && (
            <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              padding: '0.75rem',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              marginBottom: '1rem'
            }}>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="button" 
            style={{ marginTop: '1rem' }}
            disabled={loading}
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>

          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
              📱 <strong>Данные для входа с телефона:</strong>
            </p>
            <div style={{ 
              fontSize: '0.8rem', 
              color: '#374151',
              backgroundColor: '#f3f4f6',
              padding: '1rem',
              borderRadius: '0.5rem',
              marginBottom: '1rem'
            }}>
              <p style={{ margin: '0.25rem 0', fontWeight: '600' }}>📞 Телефон: <span style={{ color: '#059669' }}>+77771234567</span></p>
              <p style={{ margin: '0.25rem 0', fontWeight: '600' }}>🔑 Пароль: <span style={{ color: '#059669' }}>1234</span></p>
              <button
                type="button"
                onClick={() => setCredentials({ phone: '+77771234567', password: '1234' })}
                style={{
                  marginTop: '0.5rem',
                  padding: '0.5rem 1rem',
                  backgroundColor: '#059669',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.25rem',
                  fontSize: '0.75rem',
                  cursor: 'pointer'
                }}
              >
                📱 Заполнить данные
              </button>
            </div>
          <div style={{ marginTop: '1rem' }}>
            <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem', textAlign: 'center' }}>
              <strong>🚀 Быстрый вход:</strong>
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setCredentials({ phone: '+77771234568', password: '1234' })}
                style={{
                  padding: '0.5rem',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.25rem',
                  fontSize: '0.75rem',
                  cursor: 'pointer'
                }}
              >
                👨‍⚕️ Войти как Врач
              </button>
              <button
                type="button"
                onClick={() => setCredentials({ phone: '+77771234569', password: '1234' })}
                style={{
                  padding: '0.5rem',
                  backgroundColor: '#059669',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.25rem',
                  fontSize: '0.75rem',
                  cursor: 'pointer'
                }}
              >
                👩‍⚕️ Войти как Медсестра
              </button>
              <button
                type="button"
                onClick={() => setCredentials({ phone: '+77771234570', password: '1234' })}
                style={{
                  padding: '0.5rem',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.25rem',
                  fontSize: '0.75rem',
                  cursor: 'pointer'
                }}
              >
                📋 Войти как Регистратор
        </button>
            </div>
          </div>
          
          <div style={{ marginTop: '1rem', padding: '0.5rem', backgroundColor: '#f3f4f6', borderRadius: '0.25rem' }}>
            <p style={{ fontSize: '0.7rem', color: '#6b7280', margin: '0.25rem 0' }}>
              <strong>📱 Отладка:</strong>
            </p>
            <p style={{ fontSize: '0.6rem', color: '#9ca3af', margin: '0.1rem 0' }}>
              User Agent: {navigator.userAgent.substring(0, 50)}...
            </p>
            <p style={{ fontSize: '0.6rem', color: '#9ca3af', margin: '0.1rem 0' }}>
              URL: {window.location.href}
            </p>
            <p style={{ fontSize: '0.6rem', color: '#9ca3af', margin: '0.1rem 0' }}>
              Токен в localStorage: {localStorage.getItem('access_token') ? 'ЕСТЬ' : 'НЕТ'}
            </p>
            <p style={{ fontSize: '0.6rem', color: '#9ca3af', margin: '0.1rem 0' }}>
              Пользователь в localStorage: {localStorage.getItem('user') ? 'ЕСТЬ' : 'НЕТ'}
            </p>
          </div>
          </div>
        </form>
      </div>
    </div>
  );
};



const App: React.FC = () => {
  return (
    <ClinicProvider>
      <Router>
        <AppContent />
      </Router>
    </ClinicProvider>
  );
};

export default App;

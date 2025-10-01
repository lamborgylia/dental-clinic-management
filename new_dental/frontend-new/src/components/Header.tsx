import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/auth';

interface HeaderProps {
  clinicName?: string;
}

const Header: React.FC<HeaderProps> = ({ clinicName = "DentalCare" }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = authService.getUser();
  const token = authService.getToken();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);

  // Определяем, находится ли пользователь в своем кабинете
  const isInDoctorCabinet = location.pathname === '/doctor';
  const isInAdminPanel = location.pathname === '/admin';
  const isInPatientsPage = location.pathname === '/patients';
  const isInPatientDashboard = location.pathname.startsWith('/patient/');

  const handleHome = () => {
    navigate('/');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/');
  };


  const handleAdminPanel = () => {
    if (user && user.role === 'admin') {
      navigate('/admin');
    }
  };

  const handleNavigateToSection = (section: string) => {
    if (user) {
      switch (user.role) {
        case 'admin':
          navigate(`/admin?tab=${section}`);
          break;
        case 'doctor':
        case 'nurse':
          navigate(`/doctor?tab=${section}`);
          break;
        case 'registrar':
          navigate(`/patients?tab=${section}`);
          break;
        case 'patient':
          navigate(`/patient/1?tab=${section}`);
          break;
        default:
          navigate('/');
      }
    }
    closeMobileMenu();
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Закрытие мобильного меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  return (
    <header ref={headerRef} style={{
      padding: 'clamp(0.5rem, 2vw, 1rem) clamp(1rem, 4vw, 2rem)', // Возвращаем нормальный padding
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      <div className="header-container" style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        flexWrap: 'wrap',
        gap: 'clamp(0.5rem, 2vw, 1rem)'
      }}>
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 'clamp(0.25rem, 1.5vw, 0.5rem)',
            cursor: 'pointer',
            minWidth: 'fit-content'
          }}
          onClick={handleHome}
        >
          <div style={{
            width: 'clamp(32px, 6vw, 40px)',
            height: 'clamp(32px, 6vw, 40px)',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <svg width="clamp(20px, 4vw, 24px)" height="clamp(20px, 4vw, 24px)" fill="white" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <h1 style={{ 
            color: '#333', 
            margin: 0, 
            fontSize: 'clamp(1rem, 3vw, 1.5rem)', 
            fontWeight: 'bold',
            whiteSpace: 'nowrap'
          }}>
            {clinicName}
          </h1>
        </div>
        
        {user && token ? (
          <div className="header-buttons" style={{ 
            display: 'flex', 
            gap: 'clamp(0.5rem, 2vw, 1rem)', 
            alignItems: 'center',
            flexWrap: 'wrap',
            justifyContent: 'flex-end',
            minWidth: 'fit-content'
          }}>
            {/* Десктопная версия - скрываем на мобильных */}
            <div className="desktop-buttons" style={{
              display: 'flex',
              gap: 'clamp(0.5rem, 2vw, 1rem)',
              alignItems: 'center'
            }}>
              <span className="welcome-text" style={{ 
                color: '#666', 
                fontSize: 'clamp(0.75rem, 2.5vw, 0.9rem)',
                whiteSpace: 'nowrap',
                display: 'none' // Скрываем на мобильных для экономии места
              }}>
                Добро пожаловать, {user.full_name || user.phone}! 
                <span style={{ color: '#999', marginLeft: '0.5rem' }}>
                  ({user.role === 'admin' ? 'Администратор' : 
                    user.role === 'doctor' ? 'Врач' : 
                    user.role === 'nurse' ? 'Медсестра' : 
                    user.role === 'registrar' ? 'Регистратор' : 'Пациент'})
                </span>
              </span>
            
            {user.role === 'admin' && (
              <button
                onClick={handleAdminPanel}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  padding: 'clamp(0.5rem, 2vw, 0.75rem) clamp(0.75rem, 3vw, 1.5rem)',
                  borderRadius: '8px',
                  fontSize: 'clamp(0.8rem, 2.5vw, 1rem)',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  whiteSpace: 'nowrap',
                  minWidth: 'fit-content'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.15)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                }}
              >
                Админ-панель
              </button>
            )}
            
            
            {/* Навигационные кнопки для десктопа */}
            {user && (
              <div className="desktop-navigation" style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'clamp(0.5rem, 2vw, 1rem)',
                marginLeft: 'clamp(1rem, 4vw, 2rem)'
              }}>
                {/* Кнопки для врачей и медсестер */}
                {(user.role === 'doctor' || user.role === 'nurse') && (
                  <>
                    <button
                      onClick={() => handleNavigateToSection('patients')}
                      style={{
                        background: 'rgba(102, 126, 234, 0.1)',
                        color: '#667eea',
                        border: '1px solid rgba(102, 126, 234, 0.2)',
                        padding: 'clamp(0.5rem, 1.5vw, 0.75rem) clamp(0.75rem, 2vw, 1rem)',
                        borderRadius: '8px',
                        fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        whiteSpace: 'nowrap'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = 'rgba(102, 126, 234, 0.2)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                      Пациенты
                    </button>

                    <button
                      onClick={() => handleNavigateToSection('treatment-plans')}
                      style={{
                        background: 'rgba(102, 126, 234, 0.1)',
                        color: '#667eea',
                        border: '1px solid rgba(102, 126, 234, 0.2)',
                        padding: 'clamp(0.5rem, 1.5vw, 0.75rem) clamp(0.75rem, 2vw, 1rem)',
                        borderRadius: '8px',
                        fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        whiteSpace: 'nowrap'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = 'rgba(102, 126, 234, 0.2)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 11H7v6h2v-6zm4 0h-2v6h2v-6zm4 0h-2v6h2v-6zm2-7H3v2h16V4z"/>
                      </svg>
                      Планы лечения
                    </button>

                    <button
                      onClick={() => handleNavigateToSection('services')}
                      style={{
                        background: 'rgba(102, 126, 234, 0.1)',
                        color: '#667eea',
                        border: '1px solid rgba(102, 126, 234, 0.2)',
                        padding: 'clamp(0.5rem, 1.5vw, 0.75rem) clamp(0.75rem, 2vw, 1rem)',
                        borderRadius: '8px',
                        fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        whiteSpace: 'nowrap'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = 'rgba(102, 126, 234, 0.2)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                      Услуги
                    </button>

                    <button
                      onClick={() => handleNavigateToSection('calendar')}
                      style={{
                        background: 'rgba(102, 126, 234, 0.1)',
                        color: '#667eea',
                        border: '1px solid rgba(102, 126, 234, 0.2)',
                        padding: 'clamp(0.5rem, 1.5vw, 0.75rem) clamp(0.75rem, 2vw, 1rem)',
                        borderRadius: '8px',
                        fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        whiteSpace: 'nowrap'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = 'rgba(102, 126, 234, 0.2)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                      </svg>
                      Календарь
                    </button>

                    <button
                      onClick={() => navigate('/treatment-orders')}
                      style={{
                        background: 'rgba(102, 126, 234, 0.1)',
                        color: '#667eea',
                        border: '1px solid rgba(102, 126, 234, 0.2)',
                        padding: 'clamp(0.5rem, 1.5vw, 0.75rem) clamp(0.75rem, 2vw, 1rem)',
                        borderRadius: '8px',
                        fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        whiteSpace: 'nowrap'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = 'rgba(102, 126, 234, 0.2)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                      </svg>
                      Наряды
                    </button>
                  </>
                )}

                {/* Кнопки для админов */}
                {user.role === 'admin' && (
                  <>
                    <button
                      onClick={() => handleNavigateToSection('users')}
                      style={{
                        background: 'rgba(102, 126, 234, 0.1)',
                        color: '#667eea',
                        border: '1px solid rgba(102, 126, 234, 0.2)',
                        padding: 'clamp(0.5rem, 1.5vw, 0.75rem) clamp(0.75rem, 2vw, 1rem)',
                        borderRadius: '8px',
                        fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        whiteSpace: 'nowrap'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = 'rgba(102, 126, 234, 0.2)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                      Пользователи
                    </button>

                    <button
                      onClick={() => handleNavigateToSection('clinics')}
                      style={{
                        background: 'rgba(102, 126, 234, 0.1)',
                        color: '#667eea',
                        border: '1px solid rgba(102, 126, 234, 0.2)',
                        padding: 'clamp(0.5rem, 1.5vw, 0.75rem) clamp(0.75rem, 2vw, 1rem)',
                        borderRadius: '8px',
                        fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        whiteSpace: 'nowrap'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = 'rgba(102, 126, 234, 0.2)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                      Клиники
                    </button>
                  </>
                )}

                {/* Кнопки для регистраторов */}
                {user.role === 'registrar' && (
                  <>
                    <button
                      onClick={() => handleNavigateToSection('patients')}
                      style={{
                        background: 'rgba(102, 126, 234, 0.1)',
                        color: '#667eea',
                        border: '1px solid rgba(102, 126, 234, 0.2)',
                        padding: 'clamp(0.5rem, 1.5vw, 0.75rem) clamp(0.75rem, 2vw, 1rem)',
                        borderRadius: '8px',
                        fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        whiteSpace: 'nowrap'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = 'rgba(102, 126, 234, 0.2)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                      Пациенты
                    </button>

                    <button
                      onClick={() => handleNavigateToSection('appointments')}
                      style={{
                        background: 'rgba(102, 126, 234, 0.1)',
                        color: '#667eea',
                        border: '1px solid rgba(102, 126, 234, 0.2)',
                        padding: 'clamp(0.5rem, 1.5vw, 0.75rem) clamp(0.75rem, 2vw, 1rem)',
                        borderRadius: '8px',
                        fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        whiteSpace: 'nowrap'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = 'rgba(102, 126, 234, 0.2)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                      </svg>
                      Записи на прием
                    </button>
                  </>
                )}

                {/* Кнопки для пациентов */}
                {user.role === 'patient' && (
                  <>
                    <button
                      onClick={() => handleNavigateToSection('profile')}
                      style={{
                        background: 'rgba(102, 126, 234, 0.1)',
                        color: '#667eea',
                        border: '1px solid rgba(102, 126, 234, 0.2)',
                        padding: 'clamp(0.5rem, 1.5vw, 0.75rem) clamp(0.75rem, 2vw, 1rem)',
                        borderRadius: '8px',
                        fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        whiteSpace: 'nowrap'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = 'rgba(102, 126, 234, 0.2)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                      Профиль
                    </button>

                    <button
                      onClick={() => handleNavigateToSection('appointments')}
                      style={{
                        background: 'rgba(102, 126, 234, 0.1)',
                        color: '#667eea',
                        border: '1px solid rgba(102, 126, 234, 0.2)',
                        padding: 'clamp(0.5rem, 1.5vw, 0.75rem) clamp(0.75rem, 2vw, 1rem)',
                        borderRadius: '8px',
                        fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        whiteSpace: 'nowrap'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = 'rgba(102, 126, 234, 0.2)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                      </svg>
                      Мои записи
                    </button>

                    <button
                      onClick={() => handleNavigateToSection('treatment-plans')}
                      style={{
                        background: 'rgba(102, 126, 234, 0.1)',
                        color: '#667eea',
                        border: '1px solid rgba(102, 126, 234, 0.2)',
                        padding: 'clamp(0.5rem, 1.5vw, 0.75rem) clamp(0.75rem, 2vw, 1rem)',
                        borderRadius: '8px',
                        fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        whiteSpace: 'nowrap'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = 'rgba(102, 126, 234, 0.2)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 11H7v6h2v-6zm4 0h-2v6h2v-6zm4 0h-2v6h2v-6zm2-7H3v2h16V4z"/>
                      </svg>
                      Планы лечения
                    </button>
                  </>
                )}
              </div>
            )}

            <button
              className="desktop-logout"
              onClick={handleLogout}
              style={{
                background: 'transparent',
                color: '#666',
                border: '2px solid #ddd',
                padding: 'clamp(0.5rem, 2vw, 0.75rem) clamp(0.75rem, 3vw, 1.5rem)',
                borderRadius: '8px',
                fontSize: 'clamp(0.8rem, 2.5vw, 1rem)',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                whiteSpace: 'nowrap',
                minWidth: 'fit-content'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = '#999';
                e.currentTarget.style.background = '#f5f5f5';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = '#ddd';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              Выйти
            </button>
            </div>

            {/* Мобильное бургер-меню */}
            <div className="mobile-menu" style={{ display: 'flex', alignItems: 'center' }}>
              <button
                onClick={toggleMobileMenu}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem'
                }}
                aria-label="Открыть меню"
              >
                <div style={{
                  width: '24px',
                  height: '3px',
                  backgroundColor: '#333',
                  borderRadius: '2px',
                  transition: 'all 0.3s ease',
                  transform: isMobileMenuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none'
                }}></div>
                <div style={{
                  width: '24px',
                  height: '3px',
                  backgroundColor: '#333',
                  borderRadius: '2px',
                  transition: 'all 0.3s ease',
                  opacity: isMobileMenuOpen ? 0 : 1
                }}></div>
                <div style={{
                  width: '24px',
                  height: '3px',
                  backgroundColor: '#333',
                  borderRadius: '2px',
                  transition: 'all 0.3s ease',
                  transform: isMobileMenuOpen ? 'rotate(-45deg) translate(7px, -6px)' : 'none'
                }}></div>
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={handleLogin}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              padding: 'clamp(0.5rem, 2vw, 0.75rem) clamp(0.75rem, 3vw, 1.5rem)',
              borderRadius: '8px',
              fontSize: 'clamp(0.8rem, 2.5vw, 1rem)',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              whiteSpace: 'nowrap',
              minWidth: 'fit-content'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.15)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
            }}
          >
            Войти
          </button>
        )}

        {/* Мобильное выпадающее меню */}
        {isMobileMenuOpen && user && token && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: 'white',
            borderTop: '1px solid #e5e7eb',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            zIndex: 1000,
            padding: '1rem'
          }}>
            <div style={{
              maxWidth: '1200px',
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              {/* Информация о пользователе */}
              <div style={{
                padding: '0.75rem',
                backgroundColor: '#f9fafb',
                borderRadius: '0.5rem',
                marginBottom: '0.5rem'
              }}>
                <div style={{ 
                  color: '#666', 
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}>
                  Добро пожаловать, {user.full_name || user.phone}!
                </div>
                <div style={{ 
                  color: '#999', 
                  fontSize: '0.8rem',
                  marginTop: '0.25rem'
                }}>
                  {user.role === 'admin' ? 'Администратор' : 
                   user.role === 'doctor' ? 'Врач' : 
                   user.role === 'nurse' ? 'Медсестра' : 
                   user.role === 'registrar' ? 'Регистратор' : 'Пациент'}
                </div>
              </div>

              {/* Навигационные кнопки для всех ролей */}
              {user && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  marginBottom: '0.5rem'
                }}>
                  <div style={{
                    color: '#666',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    marginBottom: '0.25rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Навигация
                  </div>
                  
                  {/* Кнопки для врачей и медсестер */}
                  {(user.role === 'doctor' || user.role === 'nurse') && (
                    <>
                      <button
                        onClick={() => handleNavigateToSection('patients')}
                        style={{
                          background: 'rgba(102, 126, 234, 0.1)',
                          color: '#667eea',
                          border: '1px solid rgba(102, 126, 234, 0.2)',
                          padding: '0.75rem 1rem',
                          borderRadius: '8px',
                          fontSize: '0.9rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        </svg>
                        Пациенты
                      </button>

                      <button
                        onClick={() => handleNavigateToSection('treatment-plans')}
                        style={{
                          background: 'rgba(102, 126, 234, 0.1)',
                          color: '#667eea',
                          border: '1px solid rgba(102, 126, 234, 0.2)',
                          padding: '0.75rem 1rem',
                          borderRadius: '8px',
                          fontSize: '0.9rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 11H7v6h2v-6zm4 0h-2v6h2v-6zm4 0h-2v6h2v-6zm2-7H3v2h16V4z"/>
                        </svg>
                        Планы лечения
                      </button>

                      <button
                        onClick={() => handleNavigateToSection('services')}
                        style={{
                          background: 'rgba(102, 126, 234, 0.1)',
                          color: '#667eea',
                          border: '1px solid rgba(102, 126, 234, 0.2)',
                          padding: '0.75rem 1rem',
                          borderRadius: '8px',
                          fontSize: '0.9rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                        Услуги
                      </button>

                      <button
                        onClick={() => handleNavigateToSection('calendar')}
                        style={{
                          background: 'rgba(102, 126, 234, 0.1)',
                          color: '#667eea',
                          border: '1px solid rgba(102, 126, 234, 0.2)',
                          padding: '0.75rem 1rem',
                          borderRadius: '8px',
                          fontSize: '0.9rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                        </svg>
                        Календарь
                      </button>

                      <button
                        onClick={() => navigate('/treatment-orders')}
                        style={{
                          background: 'rgba(102, 126, 234, 0.1)',
                          color: '#667eea',
                          border: '1px solid rgba(102, 126, 234, 0.2)',
                          padding: '0.75rem 1rem',
                          borderRadius: '8px',
                          fontSize: '0.9rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                        </svg>
                        Наряды
                      </button>
                    </>
                  )}

                  {/* Кнопки для админов */}
                  {user.role === 'admin' && (
                    <>
                      <button
                        onClick={() => handleNavigateToSection('users')}
                        style={{
                          background: 'rgba(102, 126, 234, 0.1)',
                          color: '#667eea',
                          border: '1px solid rgba(102, 126, 234, 0.2)',
                          padding: '0.75rem 1rem',
                          borderRadius: '8px',
                          fontSize: '0.9rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        </svg>
                        Пользователи
                      </button>

                      <button
                        onClick={() => handleNavigateToSection('clinics')}
                        style={{
                          background: 'rgba(102, 126, 234, 0.1)',
                          color: '#667eea',
                          border: '1px solid rgba(102, 126, 234, 0.2)',
                          padding: '0.75rem 1rem',
                          borderRadius: '8px',
                          fontSize: '0.9rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                        Клиники
                      </button>
                    </>
                  )}

                  {/* Кнопки для регистраторов */}
                  {user.role === 'registrar' && (
                    <>
                      <button
                        onClick={() => handleNavigateToSection('patients')}
                        style={{
                          background: 'rgba(102, 126, 234, 0.1)',
                          color: '#667eea',
                          border: '1px solid rgba(102, 126, 234, 0.2)',
                          padding: '0.75rem 1rem',
                          borderRadius: '8px',
                          fontSize: '0.9rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        </svg>
                        Пациенты
                      </button>

                      <button
                        onClick={() => handleNavigateToSection('appointments')}
                        style={{
                          background: 'rgba(102, 126, 234, 0.1)',
                          color: '#667eea',
                          border: '1px solid rgba(102, 126, 234, 0.2)',
                          padding: '0.75rem 1rem',
                          borderRadius: '8px',
                          fontSize: '0.9rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                        </svg>
                        Записи
                      </button>
                    </>
                  )}

                  {/* Кнопки для пациентов */}
                  {user.role === 'patient' && (
                    <>
                      <button
                        onClick={() => handleNavigateToSection('profile')}
                        style={{
                          background: 'rgba(102, 126, 234, 0.1)',
                          color: '#667eea',
                          border: '1px solid rgba(102, 126, 234, 0.2)',
                          padding: '0.75rem 1rem',
                          borderRadius: '8px',
                          fontSize: '0.9rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        </svg>
                        Профиль
                      </button>

                      <button
                        onClick={() => handleNavigateToSection('appointments')}
                        style={{
                          background: 'rgba(102, 126, 234, 0.1)',
                          color: '#667eea',
                          border: '1px solid rgba(102, 126, 234, 0.2)',
                          padding: '0.75rem 1rem',
                          borderRadius: '8px',
                          fontSize: '0.9rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                        </svg>
                        Мои записи
                      </button>

                      <button
                        onClick={() => handleNavigateToSection('treatment-plans')}
                        style={{
                          background: 'rgba(102, 126, 234, 0.1)',
                          color: '#667eea',
                          border: '1px solid rgba(102, 126, 234, 0.2)',
                          padding: '0.75rem 1rem',
                          borderRadius: '8px',
                          fontSize: '0.9rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 11H7v6h2v-6zm4 0h-2v6h2v-6zm4 0h-2v6h2v-6zm2-7H3v2h16V4z"/>
                        </svg>
                        Планы лечения
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Кнопки действий */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}>


                <button
                  onClick={() => {
                    handleLogout();
                    closeMobileMenu();
                  }}
                  style={{
                    background: 'transparent',
                    color: '#666',
                    border: '2px solid #ddd',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    textAlign: 'left'
                  }}
                >
                  Выйти
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Адаптивные стили */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-buttons {
            display: none !important;
          }
          
          .desktop-navigation {
            display: none !important;
          }
          
          .desktop-logout {
            display: none !important;
          }
          
          .mobile-menu {
            display: flex !important;
          }
        }
        
        @media (min-width: 769px) {
          .desktop-buttons {
            display: flex !important;
          }
          
          .desktop-navigation {
            display: flex !important;
          }
          
          .desktop-logout {
            display: block !important;
          }
          
          .mobile-menu {
            display: none !important;
          }
        }
        
        @media (max-width: 480px) {
          .header-container {
            padding: 0.5rem 1rem;
          }
        }
        
        @media (max-width: 1024px) {
          .desktop-navigation {
            gap: 0.5rem !important;
            margin-left: 1rem !important;
          }
          
          .desktop-navigation button {
            padding: 0.5rem 0.75rem !important;
            font-size: 0.8rem !important;
          }
        }
      `}</style>
    </header>
  );
};

export default Header;

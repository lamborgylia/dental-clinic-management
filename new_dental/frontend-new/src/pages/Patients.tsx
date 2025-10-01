import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
  clinic_id: number;
}

const Patients: React.FC = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServices();
  }, []);

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

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    navigate('/login');
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
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        padding: '1rem 2rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ margin: 0, color: '#111827' }}>Панель пациента</h1>
        <button
          onClick={handleLogout}
          style={{
            backgroundColor: '#dc2626',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '0.375rem',
            cursor: 'pointer'
          }}
        >
          Выйти
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: '2rem' }}>
        <h2>Услуги клиники</h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1.5rem'
        }}>
          {services.map(service => (
            <div
              key={service.id}
              style={{
                backgroundColor: 'white',
                borderRadius: '0.5rem',
                padding: '1.5rem',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e5e7eb'
              }}
            >
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#111827' }}>{service.name}</h3>
              <p style={{ color: '#6b7280', margin: '0 0 1rem 0' }}>{service.description}</p>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  color: '#059669'
                }}>
                  {service.price} ₸
                </span>
                <button
                  style={{
                    backgroundColor: '#2563eb',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.375rem',
                    cursor: 'pointer'
                  }}
                >
                  Записаться
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Patients;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

interface TreatmentOrder {
  id: number;
  patient_id: number;
  patient_name: string;
  patient_phone: string;
  patient_iin: string;
  doctor_id: number;
  doctor_name: string;
  appointment_id: number;
  visit_date: string;
  services: TreatmentOrderService[];
  total_amount: number;
  status: string;
  created_at: string;
}

interface TreatmentOrderService {
  id: number;
  service_id: number;
  service_name: string;
  service_price: number;
  quantity: number;
  tooth_number: number;
}

const TreatmentOrders: React.FC = () => {
  const navigate = useNavigate();
  const [treatmentOrders, setTreatmentOrders] = useState<TreatmentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTreatmentOrders();
  }, []);

  const fetchTreatmentOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/treatment-orders/');
      setTreatmentOrders(response.data);
    } catch (error) {
      console.error('Ошибка загрузки нарядов:', error);
      setError('Ошибка загрузки нарядов');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = () => {
    navigate('/treatment-orders/create');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('ru-RU') + ' ₸';
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div>Загрузка нарядов...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ color: 'red' }}>{error}</div>
        <button 
          onClick={fetchTreatmentOrders}
          style={{
            marginTop: '1rem',
            padding: '0.5rem 1rem',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer'
          }}
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <div style={{ 
        padding: 'clamp(0.5rem, 2vw, 2rem)',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box'
      }}>
        {/* Заголовок и кнопка создания */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: 'clamp(0.5rem, 2vw, 1rem)',
          flexWrap: 'wrap',
          gap: 'clamp(0.5rem, 2vw, 1rem)'
        }}>
          <h1 style={{ 
            fontSize: 'clamp(1.5rem, 4vw, 2rem)',
            margin: 0,
            color: '#1f2937'
          }}>Наряды клиники</h1>
          <button
            onClick={handleCreateOrder}
            style={{
              backgroundColor: '#059669',
              color: 'white',
              border: 'none',
              padding: 'clamp(0.5rem, 2vw, 0.75rem) clamp(1rem, 3vw, 1.5rem)',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
              whiteSpace: 'nowrap',
              minWidth: 'fit-content',
              fontWeight: '500'
            }}
          >
            + Создать наряд
          </button>
        </div>

        {/* Таблица нарядов */}
        {treatmentOrders.length === 0 ? (
          <div style={{
            backgroundColor: 'white',
            padding: '3rem',
            borderRadius: '0.5rem',
            textAlign: 'center',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ fontSize: '1.125rem', color: '#6b7280', marginBottom: '1rem' }}>
              Наряды не найдены
            </div>
            <div style={{ color: '#9ca3af', marginBottom: '2rem' }}>
              Создайте первый наряд для начала работы
            </div>
            <button
              onClick={handleCreateOrder}
              style={{
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Создать наряд
            </button>
          </div>
        ) : (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            overflow: 'auto'
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              minWidth: '800px'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  <th style={{ 
                    padding: 'clamp(0.75rem, 2vw, 1rem)', 
                    textAlign: 'left', 
                    fontWeight: '600',
                    fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb'
                  }}>ID</th>
                  <th style={{ 
                    padding: 'clamp(0.75rem, 2vw, 1rem)', 
                    textAlign: 'left', 
                    fontWeight: '600',
                    fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb'
                  }}>Пациент</th>
                  <th style={{ 
                    padding: 'clamp(0.75rem, 2vw, 1rem)', 
                    textAlign: 'left', 
                    fontWeight: '600',
                    fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb'
                  }}>Врач</th>
                  <th style={{ 
                    padding: 'clamp(0.75rem, 2vw, 1rem)', 
                    textAlign: 'left', 
                    fontWeight: '600',
                    fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb'
                  }}>Дата приема</th>
                  <th style={{ 
                    padding: 'clamp(0.75rem, 2vw, 1rem)', 
                    textAlign: 'left', 
                    fontWeight: '600',
                    fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb'
                  }}>Услуги</th>
                  <th style={{ 
                    padding: 'clamp(0.75rem, 2vw, 1rem)', 
                    textAlign: 'left', 
                    fontWeight: '600',
                    fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb'
                  }}>Сумма</th>
                  <th style={{ 
                    padding: 'clamp(0.75rem, 2vw, 1rem)', 
                    textAlign: 'left', 
                    fontWeight: '600',
                    fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb'
                  }}>Статус</th>
                  <th style={{ 
                    padding: 'clamp(0.75rem, 2vw, 1rem)', 
                    textAlign: 'left', 
                    fontWeight: '600',
                    fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb'
                  }}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {treatmentOrders.map((order) => (
                  <tr key={order.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ 
                      padding: 'clamp(0.75rem, 2vw, 1rem)', 
                      fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                      color: '#6b7280'
                    }}>#{order.id}</td>
                    <td style={{ 
                      padding: 'clamp(0.75rem, 2vw, 1rem)',
                      fontSize: 'clamp(0.875rem, 2.5vw, 1rem)'
                    }}>
                      <div>
                        <div style={{ fontWeight: '500', color: '#1f2937' }}>
                          {order.patient_name}
                        </div>
                        <div style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)', color: '#6b7280' }}>
                          {order.patient_phone}
                        </div>
                      </div>
                    </td>
                    <td style={{ 
                      padding: 'clamp(0.75rem, 2vw, 1rem)',
                      fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                      color: '#1f2937'
                    }}>{order.doctor_name}</td>
                    <td style={{ 
                      padding: 'clamp(0.75rem, 2vw, 1rem)',
                      fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                      color: '#6b7280'
                    }}>{formatDate(order.visit_date)}</td>
                    <td style={{ 
                      padding: 'clamp(0.75rem, 2vw, 1rem)',
                      fontSize: 'clamp(0.875rem, 2.5vw, 1rem)'
                    }}>
                      <div style={{ maxWidth: '200px' }}>
                        {order.services.map((service, index) => (
                          <div key={index} style={{ 
                            marginBottom: '0.25rem',
                            fontSize: 'clamp(0.75rem, 2vw, 0.875rem)'
                          }}>
                            <span style={{ fontWeight: '500' }}>
                              Зуб {service.tooth_number}:
                            </span>
                            <span style={{ marginLeft: '0.25rem' }}>
                              {service.service_name} (x{service.quantity})
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td style={{ 
                      padding: 'clamp(0.75rem, 2vw, 1rem)',
                      fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                      fontWeight: '500',
                      color: '#059669'
                    }}>{formatPrice(order.total_amount)}</td>
                    <td style={{ 
                      padding: 'clamp(0.75rem, 2vw, 1rem)',
                      fontSize: 'clamp(0.875rem, 2.5vw, 1rem)'
                    }}>
                      <span style={{
                        backgroundColor: order.status === 'completed' ? '#dcfce7' : '#fef2f2',
                        color: order.status === 'completed' ? '#166534' : '#dc2626',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.375rem',
                        fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                        fontWeight: '500'
                      }}>
                        {order.status === 'completed' ? 'Завершен' : 'В процессе'}
                      </span>
                    </td>
                    <td style={{ 
                      padding: 'clamp(0.75rem, 2vw, 1rem)',
                      fontSize: 'clamp(0.875rem, 2.5vw, 1rem)'
                    }}>
                      <button
                        onClick={() => navigate(`/treatment-orders/${order.id}`)}
                        style={{
                          backgroundColor: '#2563eb',
                          color: 'white',
                          border: 'none',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.375rem',
                          cursor: 'pointer',
                          fontSize: 'clamp(0.75rem, 2vw, 0.875rem)'
                        }}
                      >
                        Просмотр
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TreatmentOrders;

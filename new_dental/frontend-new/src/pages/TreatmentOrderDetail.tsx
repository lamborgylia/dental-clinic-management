import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

interface TreatmentOrderService {
  id: number;
  service_id: number;
  service_name: string;
  service_price: number;
  quantity: number;
  tooth_number: number;
  notes?: string;
  is_completed: number;
}

interface TreatmentOrder {
  id: number;
  patient_id: number;
  patient_name: string;
  patient_phone: string;
  patient_iin: string;
  doctor_id: number;
  doctor_name: string;
  appointment_id?: number;
  visit_date: string;
  services: TreatmentOrderService[];
  total_amount: number;
  status: string;
  created_at: string;
}

const TreatmentOrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [treatmentOrder, setTreatmentOrder] = useState<TreatmentOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTreatmentOrder = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/treatment-orders/${id}`);
        setTreatmentOrder(response.data);
      } catch (err) {
        console.error('Ошибка загрузки наряда:', err);
        setError('Не удалось загрузить наряд');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchTreatmentOrder();
    }
  }, [id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'KZT'
    }).format(amount);
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '200px',
        fontSize: '1.2rem',
        color: '#666'
      }}>
        Загрузка наряда...
      </div>
    );
  }

  if (error || !treatmentOrder) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '200px',
        fontSize: '1.2rem',
        color: '#e74c3c'
      }}>
        <div>{error || 'Наряд не найден'}</div>
        <button 
          onClick={() => navigate('/treatment-orders')}
          style={{
            marginTop: '1rem',
            padding: '0.5rem 1rem',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Вернуться к списку
        </button>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '2rem',
      maxWidth: '1200px',
      margin: '0 auto',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh'
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        padding: '2rem',
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
        border: '1px solid rgba(255,255,255,0.2)'
      }}>
        {/* Заголовок */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '2rem',
          paddingBottom: '1rem',
          borderBottom: '2px solid #e0e0e0'
        }}>
          <h1 style={{
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontWeight: '700',
            fontSize: '2rem',
            margin: 0
          }}>
            Наряд №{treatmentOrder.id}
          </h1>
          <button
            onClick={() => navigate('/treatment-orders')}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white',
              border: 'none',
              borderRadius: '15px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '500',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
            }}
          >
            ← Назад к списку
          </button>
        </div>

        {/* Информация о наряде */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '2rem',
          marginBottom: '2rem'
        }}>
          {/* Информация о пациенте */}
          <div style={{
            background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
            padding: '1.5rem',
            borderRadius: '15px',
            border: '1px solid #bae6fd'
          }}>
            <h3 style={{ 
              margin: '0 0 1rem 0', 
              color: '#0369a1',
              fontSize: '1.2rem',
              fontWeight: '600'
            }}>
              Информация о пациенте
            </h3>
            <div style={{ lineHeight: '1.8' }}>
              <div><strong>ФИО:</strong> {treatmentOrder.patient_name}</div>
              <div><strong>Телефон:</strong> {treatmentOrder.patient_phone}</div>
              <div><strong>ИИН:</strong> {treatmentOrder.patient_iin}</div>
            </div>
          </div>

          {/* Информация о враче */}
          <div style={{
            background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
            padding: '1.5rem',
            borderRadius: '15px',
            border: '1px solid #bbf7d0'
          }}>
            <h3 style={{ 
              margin: '0 0 1rem 0', 
              color: '#166534',
              fontSize: '1.2rem',
              fontWeight: '600'
            }}>
              Информация о враче
            </h3>
            <div style={{ lineHeight: '1.8' }}>
              <div><strong>Врач:</strong> {treatmentOrder.doctor_name}</div>
              <div><strong>Дата приема:</strong> {formatDate(treatmentOrder.visit_date)}</div>
              <div><strong>Статус:</strong> 
                <span style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '20px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  backgroundColor: treatmentOrder.status === 'completed' ? '#dcfce7' : '#fef3c7',
                  color: treatmentOrder.status === 'completed' ? '#166534' : '#92400e',
                  marginLeft: '0.5rem'
                }}>
                  {treatmentOrder.status === 'completed' ? 'Завершен' : 'В процессе'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Услуги */}
        <div style={{
          background: 'linear-gradient(135deg, #fefce8, #fef3c7)',
          padding: '1.5rem',
          borderRadius: '15px',
          border: '1px solid #fde68a',
          marginBottom: '2rem'
        }}>
          <h3 style={{ 
            margin: '0 0 1rem 0', 
            color: '#92400e',
            fontSize: '1.2rem',
            fontWeight: '600'
          }}>
            Услуги
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              fontSize: '0.95rem'
            }}>
              <thead>
                <tr style={{ 
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: 'white'
                }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderRadius: '8px 0 0 0' }}>Услуга</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center' }}>Зуб</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center' }}>Количество</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Цена</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', borderRadius: '0 8px 0 0' }}>Сумма</th>
                </tr>
              </thead>
              <tbody>
                {treatmentOrder.services.map((service, index) => (
                  <tr key={service.id} style={{ 
                    borderBottom: '1px solid #fde68a',
                    backgroundColor: index % 2 === 0 ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.8)'
                  }}>
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ fontWeight: '500' }}>{service.service_name}</div>
                      {service.notes && (
                        <div style={{ 
                          fontSize: '0.875rem', 
                          color: '#6b7280', 
                          marginTop: '0.25rem',
                          fontStyle: 'italic'
                        }}>
                          {service.notes}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      {service.tooth_number > 0 ? service.tooth_number : '-'}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      {service.quantity}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      {formatCurrency(service.service_price)}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600' }}>
                      {formatCurrency(service.service_price * service.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Итого */}
        <div style={{
          background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)',
          padding: '1.5rem',
          borderRadius: '15px',
          border: '1px solid #a7f3d0',
          textAlign: 'right'
        }}>
          <div style={{ 
            fontSize: '1.5rem', 
            fontWeight: '700', 
            color: '#065f46',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>Общая сумма:</span>
            <span>{formatCurrency(treatmentOrder.total_amount)}</span>
          </div>
        </div>

        {/* Дополнительная информация */}
        <div style={{ 
          marginTop: '2rem', 
          padding: '1rem', 
          background: 'rgba(0,0,0,0.05)', 
          borderRadius: '10px',
          fontSize: '0.875rem',
          color: '#6b7280'
        }}>
          <div><strong>Дата создания:</strong> {formatDate(treatmentOrder.created_at)}</div>
          {treatmentOrder.appointment_id && (
            <div><strong>ID записи:</strong> {treatmentOrder.appointment_id}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TreatmentOrderDetail;

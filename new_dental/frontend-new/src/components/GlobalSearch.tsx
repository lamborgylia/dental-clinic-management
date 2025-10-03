import React, { useState } from 'react';
import api from '../services/api';

interface SearchResult {
  type: 'patient' | 'appointment' | 'treatment_plan' | 'treatment_order';
  id: number;
  title: string;
  subtitle: string;
  data: any;
}

interface GlobalSearchProps {
  onResultClick: (result: SearchResult) => void;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({ onResultClick }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const search = async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setLoading(true);
    try {
      const searchResults: SearchResult[] = [];

      // Поиск пациентов
      try {
        const patientsRes = await api.get(`/patients/`, {
          params: { search: query.trim() }
        });
        if (patientsRes.data && Array.isArray(patientsRes.data)) {
          patientsRes.data.forEach((patient: any) => {
            searchResults.push({
              type: 'patient',
              id: patient.id,
              title: patient.full_name,
              subtitle: `Телефон: ${patient.phone} | ИИН: ${patient.iin}`,
              data: patient
            });
          });
        }
      } catch (error) {
        console.log('Ошибка поиска пациентов:', error);
      }

      // Поиск записей
      try {
        const appointmentsRes = await api.get('/appointments/', {
          params: { search: query.trim() }
        });
        if (appointmentsRes.data && Array.isArray(appointmentsRes.data)) {
          appointmentsRes.data.forEach((appointment: any) => {
            searchResults.push({
              type: 'appointment',
              id: appointment.id,
              title: `Запись #${appointment.id}`,
              subtitle: `Пациент: ${appointment.patient_name || 'Неизвестно'} | ${new Date(appointment.appointment_datetime).toLocaleString('ru-RU')}`,
              data: appointment
            });
          });
        }
      } catch (error) {
        console.log('Ошибка поиска записей:', error);
      }

      // Поиск планов лечения
      try {
        const plansRes = await api.get('/treatment-plans/', {
          params: { search: query.trim() }
        });
        if (plansRes.data && Array.isArray(plansRes.data)) {
          plansRes.data.forEach((plan: any) => {
            searchResults.push({
              type: 'treatment_plan',
              id: plan.id,
              title: `План лечения #${plan.id}`,
              subtitle: `Диагноз: ${plan.diagnosis || 'Не указан'} | Статус: ${plan.status}`,
              data: plan
            });
          });
        }
      } catch (error) {
        console.log('Ошибка поиска планов лечения:', error);
      }

      // Поиск нарядов
      try {
        const ordersRes = await api.get('/treatment-orders/', {
          params: { search: query.trim() }
        });
        if (ordersRes.data && Array.isArray(ordersRes.data)) {
          ordersRes.data.forEach((order: any) => {
            searchResults.push({
              type: 'treatment_order',
              id: order.id,
              title: `Наряд #${order.id}`,
              subtitle: `Сумма: ${order.total_amount?.toLocaleString()} ₸ | Статус: ${order.status}`,
              data: order
            });
          });
        }
      } catch (error) {
        console.log('Ошибка поиска нарядов:', error);
      }

      setResults(searchResults.slice(0, 10)); // Ограничиваем до 10 результатов
      setShowResults(true);
    } catch (error) {
      console.error('Ошибка поиска:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Дебаунс поиска
    const timeoutId = setTimeout(() => {
      search(value);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  const handleResultClick = (result: SearchResult) => {
    onResultClick(result);
    setSearchQuery('');
    setShowResults(false);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'patient': return '👤';
      case 'appointment': return '📅';
      case 'treatment_plan': return '📋';
      case 'treatment_order': return '📄';
      default: return '🔍';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'patient': return 'Пациент';
      case 'appointment': return 'Запись';
      case 'treatment_plan': return 'План лечения';
      case 'treatment_order': return 'Наряд';
      default: return 'Результат';
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '600px' }}>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          placeholder="Поиск пациентов, записей, планов лечения, нарядов..."
          style={{
            width: '100%',
            padding: '0.75rem 1rem',
            paddingRight: loading ? '3rem' : '2.5rem',
            border: '2px solid #e5e7eb',
            borderRadius: '12px',
            fontSize: '1rem',
            outline: 'none',
            transition: 'all 0.2s ease',
            backgroundColor: 'white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
          onFocus={() => showResults && setShowResults(true)}
          onBlur={() => {
            // Задержка для возможности кликнуть по результату
            setTimeout(() => setShowResults(false), 200);
          }}
        />
        
        <div style={{
          position: 'absolute',
          right: '0.75rem',
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          {loading && (
            <div style={{
              width: '16px',
              height: '16px',
              border: '2px solid #e5e7eb',
              borderTop: '2px solid #059669',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
          )}
          <span style={{ fontSize: '1.25rem' }}>🔍</span>
        </div>
      </div>

      {showResults && results.length > 0 && (
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
          {results.map((result, index) => (
            <div
              key={`${result.type}-${result.id}`}
              onClick={() => handleResultClick(result)}
              style={{
                padding: '1rem',
                borderBottom: index < results.length - 1 ? '1px solid #f3f4f6' : 'none',
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
              <span style={{ fontSize: '1.5rem' }}>{getTypeIcon(result.type)}</span>
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
                  {getTypeLabel(result.type)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showResults && results.length === 0 && searchQuery.trim() && !loading && (
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

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default GlobalSearch;

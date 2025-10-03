import React, { useState, useEffect } from 'react';
import api from '../services/api';

interface SearchResult {
  type: 'patient' | 'appointment' | 'treatment_plan' | 'treatment_order';
  id: number;
  title: string;
  subtitle: string;
  data: any;
}

interface ResultDetailsProps {
  result: SearchResult;
  onClose: () => void;
}

const ResultDetails: React.FC<ResultDetailsProps> = ({ result, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState<any>(null);

  useEffect(() => {
    loadDetails();
  }, [result]);

  const loadDetails = async () => {
    setLoading(true);
    try {
      let response;
      switch (result.type) {
        case 'patient':
          response = await api.get(`/patients/${result.id}`);
          break;
        case 'appointment':
          response = await api.get(`/appointments/${result.id}`);
          break;
        case 'treatment_plan':
          response = await api.get(`/treatment-plans/${result.id}`);
          break;
        case 'treatment_order':
          response = await api.get(`/treatment-orders/${result.id}`);
          break;
        default:
          return;
      }
      setDetails(response.data);
    } catch (error) {
      console.error('Ошибка загрузки деталей:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderPatientDetails = () => {
    if (!details) return null;
    
    return (
      <div style={{ padding: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem', color: '#1f2937' }}>Информация о пациенте</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
          <div style={{ backgroundColor: '#f9fafb', padding: '1rem', borderRadius: '8px' }}>
            <h4 style={{ marginBottom: '0.5rem', color: '#374151' }}>Основная информация</h4>
            <p><strong>ФИО:</strong> {details.full_name}</p>
            <p><strong>Телефон:</strong> {details.phone}</p>
            <p><strong>ИИН:</strong> {details.iin}</p>
            <p><strong>Дата рождения:</strong> {details.birth_date}</p>
          </div>
          
          <div style={{ backgroundColor: '#f9fafb', padding: '1rem', borderRadius: '8px' }}>
            <h4 style={{ marginBottom: '0.5rem', color: '#374151' }}>Медицинская информация</h4>
            <p><strong>Аллергии:</strong> {details.allergies || 'Не указаны'}</p>
            <p><strong>Хронические заболевания:</strong> {details.chronic_diseases || 'Не указаны'}</p>
            <p><strong>Противопоказания:</strong> {details.contraindications || 'Не указаны'}</p>
            <p><strong>Особые заметки:</strong> {details.special_notes || 'Нет'}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderAppointmentDetails = () => {
    if (!details) return null;
    
    return (
      <div style={{ padding: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem', color: '#1f2937' }}>Информация о записи</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
          <div style={{ backgroundColor: '#f9fafb', padding: '1rem', borderRadius: '8px' }}>
            <h4 style={{ marginBottom: '0.5rem', color: '#374151' }}>Основная информация</h4>
            <p><strong>ID записи:</strong> #{details.id}</p>
            <p><strong>Дата и время:</strong> {new Date(details.appointment_datetime).toLocaleString('ru-RU')}</p>
            <p><strong>Статус:</strong> 
              <span style={{
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                fontSize: '0.75rem',
                backgroundColor: details.status === 'completed' ? '#dcfce7' : '#fef3c7',
                color: details.status === 'completed' ? '#166534' : '#92400e',
                marginLeft: '0.5rem'
              }}>
                {details.status === 'completed' ? 'Завершена' : 'Запланирована'}
              </span>
            </p>
            <p><strong>Тип услуги:</strong> {details.service_type || 'Не указан'}</p>
          </div>
          
          <div style={{ backgroundColor: '#f9fafb', padding: '1rem', borderRadius: '8px' }}>
            <h4 style={{ marginBottom: '0.5rem', color: '#374151' }}>Дополнительная информация</h4>
            <p><strong>Пациент:</strong> {details.patient_name || 'Неизвестно'}</p>
            <p><strong>Телефон пациента:</strong> {details.patient_phone || 'Не указан'}</p>
            <p><strong>ИИН пациента:</strong> {details.patient_iin || 'Не указан'}</p>
            <p><strong>Примечания:</strong> {details.notes || 'Нет'}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderTreatmentPlanDetails = () => {
    if (!details) return null;
    
    return (
      <div style={{ padding: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem', color: '#1f2937' }}>Информация о плане лечения</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
          <div style={{ backgroundColor: '#f9fafb', padding: '1rem', borderRadius: '8px' }}>
            <h4 style={{ marginBottom: '0.5rem', color: '#374151' }}>Основная информация</h4>
            <p><strong>ID плана:</strong> #{details.id}</p>
            <p><strong>Диагноз:</strong> {details.diagnosis || 'Не указан'}</p>
            <p><strong>Статус:</strong> 
              <span style={{
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                fontSize: '0.75rem',
                backgroundColor: details.status === 'completed' ? '#dcfce7' : '#fef3c7',
                color: details.status === 'completed' ? '#166534' : '#92400e',
                marginLeft: '0.5rem'
              }}>
                {details.status === 'completed' ? 'Завершен' : 'В процессе'}
              </span>
            </p>
            <p><strong>Дата создания:</strong> {new Date(details.created_at).toLocaleDateString('ru-RU')}</p>
          </div>
          
          <div style={{ backgroundColor: '#f9fafb', padding: '1rem', borderRadius: '8px' }}>
            <h4 style={{ marginBottom: '0.5rem', color: '#374151' }}>Описание лечения</h4>
            <p><strong>Описание:</strong> {details.treatment_description || 'Не указано'}</p>
            <p><strong>Общая стоимость:</strong> {details.total_cost ? `${details.total_cost.toLocaleString()} ₸` : 'Не рассчитана'}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderTreatmentOrderDetails = () => {
    if (!details) return null;
    
    return (
      <div style={{ padding: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem', color: '#1f2937' }}>Информация о наряде</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
          <div style={{ backgroundColor: '#f9fafb', padding: '1rem', borderRadius: '8px' }}>
            <h4 style={{ marginBottom: '0.5rem', color: '#374151' }}>Основная информация</h4>
            <p><strong>ID наряда:</strong> #{details.id}</p>
            <p><strong>Общая сумма:</strong> {details.total_amount ? `${details.total_amount.toLocaleString()} ₸` : 'Не указана'}</p>
            <p><strong>Статус:</strong> 
              <span style={{
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                fontSize: '0.75rem',
                backgroundColor: details.status === 'completed' ? '#dcfce7' : '#fef3c7',
                color: details.status === 'completed' ? '#166534' : '#92400e',
                marginLeft: '0.5rem'
              }}>
                {details.status === 'completed' ? 'Завершен' : 'В процессе'}
              </span>
            </p>
            <p><strong>Дата создания:</strong> {new Date(details.created_at).toLocaleDateString('ru-RU')}</p>
          </div>
          
          <div style={{ backgroundColor: '#f9fafb', padding: '1rem', borderRadius: '8px' }}>
            <h4 style={{ marginBottom: '0.5rem', color: '#374151' }}>Дополнительная информация</h4>
            <p><strong>Примечания:</strong> {details.notes || 'Нет'}</p>
            <p><strong>Дата визита:</strong> {details.visit_date ? new Date(details.visit_date).toLocaleDateString('ru-RU') : 'Не указана'}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderDetails = () => {
    if (loading) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
          <div>Загрузка деталей...</div>
        </div>
      );
    }

    switch (result.type) {
      case 'patient':
        return renderPatientDetails();
      case 'appointment':
        return renderAppointmentDetails();
      case 'treatment_plan':
        return renderTreatmentPlanDetails();
      case 'treatment_order':
        return renderTreatmentOrderDetails();
      default:
        return <div style={{ padding: '1.5rem' }}>Неизвестный тип результата</div>;
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        maxWidth: '800px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)'
      }}>
        <div style={{
          padding: '1rem 1.5rem',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ margin: 0, color: '#1f2937' }}>
            {result.type === 'patient' && '👤 Пациент'}
            {result.type === 'appointment' && '📅 Запись на прием'}
            {result.type === 'treatment_plan' && '📋 План лечения'}
            {result.type === 'treatment_order' && '📄 Наряд'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#6b7280',
              padding: '0.5rem'
            }}
          >
            ✕
          </button>
        </div>
        
        {renderDetails()}
      </div>
    </div>
  );
};

export default ResultDetails;

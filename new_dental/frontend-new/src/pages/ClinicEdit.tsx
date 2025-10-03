import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { useClinic } from '../contexts/ClinicContext';

interface Clinic {
  id: number;
  name: string;
  description: string;
  address: string;
  contacts: string;
  created_at: string;
  updated_at: string;
}

const ClinicEdit: React.FC = () => {
  const navigate = useNavigate();
  const { clinicId } = useParams<{ clinicId: string }>();
  const { clinic, refreshClinic } = useClinic();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    contacts: ''
  });

  useEffect(() => {
    if (clinic) {
      setFormData({
        name: clinic.name || '',
        description: clinic.description || '',
        address: clinic.address || '',
        contacts: clinic.contacts || ''
      });
    }
  }, [clinic]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinic) return;

    setSaving(true);
    try {
      await api.put(`/clinics/${clinic.id}`, formData);
      
      // Обновляем данные клиники в контексте
      await refreshClinic();
      
      alert('✅ Данные клиники успешно обновлены!');
      navigate('/admin');
    } catch (error) {
      console.error('Ошибка при обновлении клиники:', error);
      alert('❌ Ошибка при обновлении данных клиники');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin');
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh' 
      }}>
        <div>Загрузка...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ 
          fontSize: '2rem', 
          fontWeight: 'bold', 
          color: '#1f2937',
          marginBottom: '0.5rem'
        }}>
          Настройки клиники
        </h1>
        <p style={{ color: '#6b7280' }}>
          Редактирование информации о клинике
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ 
        backgroundColor: 'white', 
        padding: '2rem', 
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '0.5rem', 
            fontWeight: '600',
            color: '#374151'
          }}>
            Название клиники *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '1rem',
              boxSizing: 'border-box'
            }}
            placeholder="Введите название клиники"
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '0.5rem', 
            fontWeight: '600',
            color: '#374151'
          }}>
            Описание
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '1rem',
              resize: 'vertical',
              boxSizing: 'border-box'
            }}
            placeholder="Описание клиники, специализация, услуги..."
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '0.5rem', 
            fontWeight: '600',
            color: '#374151'
          }}>
            Адрес *
          </label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '1rem',
              boxSizing: 'border-box'
            }}
            placeholder="Полный адрес клиники"
          />
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '0.5rem', 
            fontWeight: '600',
            color: '#374151'
          }}>
            Контакты *
          </label>
          <textarea
            name="contacts"
            value={formData.contacts}
            onChange={handleInputChange}
            required
            rows={3}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '1rem',
              resize: 'vertical',
              boxSizing: 'border-box'
            }}
            placeholder="Телефоны, email, часы работы..."
          />
        </div>

        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          justifyContent: 'flex-end' 
        }}>
          <button
            type="button"
            onClick={handleCancel}
            disabled={saving}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: '500',
              opacity: saving ? 0.5 : 1
            }}
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: saving ? '#9ca3af' : '#059669',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: '500',
              opacity: saving ? 0.5 : 1
            }}
          >
            {saving ? 'Сохранение...' : 'Сохранить изменения'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClinicEdit;
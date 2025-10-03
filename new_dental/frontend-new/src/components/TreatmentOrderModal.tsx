import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { treatmentOrdersApi } from '../services/treatmentOrdersApi';
import type { TreatmentOrderCreate, TreatmentOrderService, TreatmentOrder } from '../types/treatmentOrder';
import TreatmentOrderPDFGenerator from './TreatmentOrderPDFGenerator';

interface Patient {
  id: number;
  full_name: string;
  phone: string;
  iin: string;
  birth_date: string;
  allergies: string;
  chronic_diseases: string;
  contraindications: string;
  special_notes: string;
}

interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
  is_active: boolean;
}

interface TreatmentOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
  appointmentId?: number;
  onSuccess?: () => void;
}

const TreatmentOrderModal: React.FC<TreatmentOrderModalProps> = ({
  isOpen,
  onClose,
  patient,
  onSuccess
}) => {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServices, setSelectedServices] = useState<TreatmentOrderService[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [createdTreatmentOrder, setCreatedTreatmentOrder] = useState<TreatmentOrder | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchServices();
      fetchCurrentUser();
    }
  }, [isOpen]);

  const fetchServices = async () => {
    try {
      const response = await api.get('/services/');
      setServices(response.data.filter((service: Service) => service.is_active));
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await api.get('/auth/me');
        setCurrentUser(response.data);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const addService = (service: Service) => {
    const existingService = selectedServices.find(s => s.service_id === service.id);
    const unitPrice = Number(service.price);
    
    if (existingService) {
      setSelectedServices(prev => 
        prev.map(s => 
          s.service_id === service.id 
            ? { ...s, quantity: s.quantity + 1, total_price: (s.quantity + 1) * s.unit_price }
            : s
        )
      );
    } else {
      setSelectedServices(prev => [...prev, {
        service_id: service.id,
        quantity: 1,
        unit_price: unitPrice,
        total_price: unitPrice
      }]);
    }
  };

  const removeService = (serviceId: number) => {
    setSelectedServices(prev => prev.filter(s => s.service_id !== serviceId));
  };

  const updateQuantity = (serviceId: number, quantity: number) => {
    if (quantity <= 0) {
      removeService(serviceId);
      return;
    }
    
    setSelectedServices(prev => 
      prev.map(s => 
        s.service_id === serviceId 
          ? { ...s, quantity, total_price: Number(quantity) * Number(s.unit_price) }
          : s
      )
    );
  };

  const calculateTotal = () => {
    return selectedServices.reduce((total, service) => total + Number(service.total_price), 0);
  };

  const handleSubmit = async () => {
    if (!patient || !currentUser || selectedServices.length === 0) return;

    setLoading(true);
    try {
      const treatmentOrder: TreatmentOrderCreate = {
        patient_id: patient.id,
        created_by_id: currentUser.id,
        total_amount: calculateTotal(),
        notes: notes.trim() || undefined,
        services: selectedServices
      };

      const createdOrder = await treatmentOrdersApi.create(treatmentOrder);
      
      // Сохраняем созданный наряд для генерации PDF
      setCreatedTreatmentOrder(createdOrder);
      
      // Очистить форму
      setSelectedServices([]);
      setNotes('');
      
      onSuccess?.();
      // Не закрываем модалку сразу, чтобы можно было создать PDF
    } catch (error) {
      console.error('Error creating treatment order:', error);
      alert('Ошибка при создании наряда');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
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
        maxWidth: '800px',
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
            Создание наряда
          </h2>
          <button
            onClick={onClose}
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

        {patient && (
          <div style={{
            backgroundColor: '#f9fafb',
            padding: '1rem',
            borderRadius: '0.5rem',
            marginBottom: '2rem'
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>Пациент</h3>
            <p style={{ margin: 0, color: '#374151' }}>
              <strong>{patient.full_name}</strong> | {patient.phone} | ИИН: {patient.iin}
            </p>
          </div>
        )}

        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>Выберите услуги</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            {services.map(service => (
              <div
                key={service.id}
                onClick={() => addService(service)}
                style={{
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  backgroundColor: 'white'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#3b82f6';
                  e.currentTarget.style.backgroundColor = '#f8fafc';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#d1d5db';
                  e.currentTarget.style.backgroundColor = 'white';
                }}
              >
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>{service.name}</h4>
                <p style={{ margin: '0 0 0.5rem 0', color: '#6b7280', fontSize: '0.875rem' }}>
                  {service.description}
                </p>
                <p style={{ margin: 0, fontWeight: 'bold', color: '#059669' }}>
                  {Number(service.price).toLocaleString()} ₸
                </p>
              </div>
            ))}
          </div>
        </div>

        {selectedServices.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>Выбранные услуги</h3>
            <div style={{
              backgroundColor: '#f9fafb',
              borderRadius: '0.5rem',
              padding: '1rem'
            }}>
              {selectedServices.map(service => {
                const serviceInfo = services.find(s => s.id === service.service_id);
                return (
                  <div key={service.service_id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.5rem 0',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontWeight: '500' }}>
                        {serviceInfo?.name}
                      </p>
                      <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
                        {Number(service.unit_price).toLocaleString()} ₸ × {service.quantity}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button
                        onClick={() => updateQuantity(service.service_id, service.quantity - 1)}
                        style={{
                          backgroundColor: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.25rem',
                          width: '2rem',
                          height: '2rem',
                          cursor: 'pointer',
                          fontSize: '1rem'
                        }}
                      >
                        -
                      </button>
                      <span style={{ minWidth: '2rem', textAlign: 'center' }}>
                        {service.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(service.service_id, service.quantity + 1)}
                        style={{
                          backgroundColor: '#059669',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.25rem',
                          width: '2rem',
                          height: '2rem',
                          cursor: 'pointer',
                          fontSize: '1rem'
                        }}
                      >
                        +
                      </button>
                      <span style={{ minWidth: '4rem', textAlign: 'right', fontWeight: 'bold' }}>
                        {Number(service.total_price).toLocaleString()} ₸
                      </span>
                      <button
                        onClick={() => removeService(service.service_id)}
                        style={{
                          backgroundColor: '#6b7280',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.25rem',
                          width: '2rem',
                          height: '2rem',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          marginLeft: '0.5rem'
                        }}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                );
              })}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem 0 0 0',
                borderTop: '2px solid #d1d5db',
                marginTop: '1rem'
              }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Итого:</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#059669' }}>
                  {calculateTotal().toLocaleString()} ₸
                </span>
              </div>
            </div>
          </div>
        )}

        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            Примечания
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              fontSize: '1rem',
              minHeight: '100px',
              resize: 'vertical'
            }}
            placeholder="Дополнительные примечания к наряду..."
          />
        </div>

        {createdTreatmentOrder && (
          <div style={{
            backgroundColor: '#f0f9ff',
            border: '1px solid #0ea5e9',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '16px',
            textAlign: 'center'
          }}>
            <h4 style={{ color: '#0369a1', margin: '0 0 8px 0' }}>
              ✅ Наряд успешно создан!
            </h4>
            <p style={{ color: '#0c4a6e', margin: '0' }}>
              Номер наряда: #{createdTreatmentOrder.id}
            </p>
          </div>
        )}

        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'flex-end'
        }}>
          {createdTreatmentOrder && patient && (
            <TreatmentOrderPDFGenerator
              treatmentOrder={createdTreatmentOrder}
              patient={patient}
              services={services}
            />
          )}
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1
            }}
          >
            {createdTreatmentOrder ? 'Закрыть' : 'Отмена'}
          </button>
          {!createdTreatmentOrder && (
            <button
              onClick={handleSubmit}
              disabled={loading || selectedServices.length === 0}
              style={{
                backgroundColor: selectedServices.length === 0 ? '#9ca3af' : '#059669',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                cursor: selectedServices.length === 0 || loading ? 'not-allowed' : 'pointer',
                opacity: selectedServices.length === 0 || loading ? 0.5 : 1
              }}
            >
              {loading ? 'Создание...' : 'Создать наряд'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TreatmentOrderModal;

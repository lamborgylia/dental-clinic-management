import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import TeethMap from '../components/TeethMap';

interface Service {
  id: number;
  name: string;
  price: number;
  description?: string;
}

interface Patient {
  id: number;
  full_name: string;
  phone: string;
  birth_date?: string;
  address?: string;
  email?: string;
}

interface TreatmentPlan {
  id: number;
  patient_id: number;
  doctor_id: number;
  diagnosis: string;
  notes: string;
  status: string;
  created_at: string;
  updated_at?: string;
  patient_name?: string;
  services?: Service[];
  total_cost?: number;
  selected_teeth?: number[];
  teeth_services?: Record<number, number[]>;
  teethServices?: Record<number, number[]>;
  toothServicesData?: any[];
  treated_teeth?: number[];
  patient_allergies?: string;
  patient_chronic_diseases?: string;
  patient_contraindications?: string;
  patient_special_notes?: string;
}

// Функция для определения мобильного устройства
const isMobile = () => {
  return window.innerWidth <= 768;
};

// Мобильный компонент плана лечения
const MobileTreatmentPlanPage: React.FC<{
  editingTreatmentPlan: TreatmentPlan | null;
  services: Service[];
  teethServices: Record<number, number[]>;
  isLoading: boolean;
  isSaving: boolean;
  teethMapRef: React.RefObject<any>;
  selectedToothForServices: number | null;
  toothServicesModal: Service[];
  toothServiceStatuses: Record<number, string>;
  formatDateTime: (dateString: string | null | undefined) => string;
  handleToothClick: (toothId: number, toothServices: Service[], serviceStatuses: Record<number, string>) => void;
  handleUpdateServiceStatus: (toothId: number, serviceId: number, status: string) => Promise<void>;
  handleRemoveServiceFromTooth: (toothId: number, serviceId: number) => Promise<void>;
  handleToothServicesChange: (newToothServices: any[]) => void;
  saveTreatmentPlan: () => Promise<void>;
  navigate: (path: string) => void;
  setEditingTreatmentPlan: React.Dispatch<React.SetStateAction<TreatmentPlan | null>>;
}> = ({
  editingTreatmentPlan,
  services,
  teethServices,
  isLoading,
  isSaving,
  teethMapRef,
  selectedToothForServices,
  toothServicesModal,
  toothServiceStatuses,
  formatDateTime,
  handleToothClick,
  handleUpdateServiceStatus,
  handleRemoveServiceFromTooth,
  handleToothServicesChange,
  saveTreatmentPlan,
  navigate,
  setEditingTreatmentPlan
}) => {
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f8fafc'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{ color: '#6b7280', fontSize: '1rem' }}>Загрузка плана лечения...</p>
        </div>
      </div>
    );
  }

  if (!editingTreatmentPlan) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f8fafc'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <p style={{ color: '#ef4444', fontSize: '1rem' }}>План лечения не найден</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      padding: '1rem'
    }}>
      {/* Заголовок */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '1rem',
        marginBottom: '1rem',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.5rem'
        }}>
          <h1 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#1f2937',
            margin: 0
          }}>
            📋 План лечения #{editingTreatmentPlan.id}
          </h1>
          <button
            onClick={() => navigate('/doctor')}
            style={{
              padding: '0.5rem',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            ← Назад
          </button>
        </div>
        <p style={{
          color: '#6b7280',
          fontSize: '0.875rem',
          margin: 0
        }}>
          Пациент: {editingTreatmentPlan.patient_name || 'Неизвестный'}
        </p>
      </div>

      {/* Информация о пациенте */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '1rem',
        marginBottom: '1rem',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
      }}>
        <h3 style={{
          fontSize: '1rem',
          fontWeight: '600',
          color: '#1f2937',
          marginBottom: '0.75rem',
          margin: 0
        }}>
          👤 Информация о пациенте
        </h3>
        
        <div style={{ marginBottom: '0.5rem' }}>
          <label style={{
            display: 'block',
            fontSize: '0.75rem',
            fontWeight: '500',
            color: '#6b7280',
            marginBottom: '0.25rem'
          }}>
            Аллергии:
          </label>
          <textarea
            value={editingTreatmentPlan.patient_allergies || ''}
            onChange={(e) => setEditingTreatmentPlan(prev => prev ? {
              ...prev,
              patient_allergies: e.target.value
            } : null)}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '0.875rem',
              resize: 'vertical',
              minHeight: '60px',
              boxSizing: 'border-box'
            }}
            placeholder="Укажите аллергии пациента..."
          />
        </div>

        <div style={{ marginBottom: '0.5rem' }}>
          <label style={{
            display: 'block',
            fontSize: '0.75rem',
            fontWeight: '500',
            color: '#6b7280',
            marginBottom: '0.25rem'
          }}>
            Хронические заболевания:
          </label>
          <textarea
            value={editingTreatmentPlan.patient_chronic_diseases || ''}
            onChange={(e) => setEditingTreatmentPlan(prev => prev ? {
              ...prev,
              patient_chronic_diseases: e.target.value
            } : null)}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '0.875rem',
              resize: 'vertical',
              minHeight: '60px',
              boxSizing: 'border-box'
            }}
            placeholder="Укажите хронические заболевания..."
          />
        </div>

        <div style={{ marginBottom: '0.5rem' }}>
          <label style={{
            display: 'block',
            fontSize: '0.75rem',
            fontWeight: '500',
            color: '#6b7280',
            marginBottom: '0.25rem'
          }}>
            Противопоказания:
          </label>
          <textarea
            value={editingTreatmentPlan.patient_contraindications || ''}
            onChange={(e) => setEditingTreatmentPlan(prev => prev ? {
              ...prev,
              patient_contraindications: e.target.value
            } : null)}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '0.875rem',
              resize: 'vertical',
              minHeight: '60px',
              boxSizing: 'border-box'
            }}
            placeholder="Укажите противопоказания..."
          />
        </div>

        <div>
          <label style={{
            display: 'block',
            fontSize: '0.75rem',
            fontWeight: '500',
            color: '#6b7280',
            marginBottom: '0.25rem'
          }}>
            Особые отметки:
          </label>
          <textarea
            value={editingTreatmentPlan.patient_special_notes || ''}
            onChange={(e) => setEditingTreatmentPlan(prev => prev ? {
              ...prev,
              patient_special_notes: e.target.value
            } : null)}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '0.875rem',
              resize: 'vertical',
              minHeight: '60px',
              boxSizing: 'border-box'
            }}
            placeholder="Дополнительные заметки..."
          />
        </div>
      </div>

      {/* Карта зубов */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '1rem',
        marginBottom: '1rem',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
      }}>
        <h3 style={{
          fontSize: '1rem',
          fontWeight: '600',
          color: '#1f2937',
          marginBottom: '0.75rem',
          margin: 0
        }}>
          🦷 Карта зубов
        </h3>
        
        <TeethMap
          ref={teethMapRef}
          services={services}
          selectedTeeth={editingTreatmentPlan.selected_teeth || []}
          toothServices={editingTreatmentPlan.toothServicesData || []}
          treatedTeeth={editingTreatmentPlan.treated_teeth || []}
          treatmentTeeth={Object.keys(editingTreatmentPlan.teethServices || {}).map(Number)}
          onToothClick={handleToothClick}
          onUpdateServiceStatus={handleUpdateServiceStatus}
          onToothServicesChange={handleToothServicesChange}
          onToothSelect={(toothId) => {
            console.log('🦷 Выбран зуб:', toothId);
            
            if (editingTreatmentPlan) {
              const currentSelectedTeeth = editingTreatmentPlan.selected_teeth || [];
              let newSelectedTeeth: number[];
              
              if (currentSelectedTeeth.includes(toothId)) {
                newSelectedTeeth = currentSelectedTeeth.filter(id => id !== toothId);
              } else {
                newSelectedTeeth = [...currentSelectedTeeth, toothId];
              }
              
              setEditingTreatmentPlan({
                ...editingTreatmentPlan,
                selected_teeth: newSelectedTeeth
              });
            }
          }}
          onAddServiceToTooth={(toothId, serviceId) => {
            console.log('🦷 Добавлена услуга к зубу:', toothId, serviceId);
            setTeethServices(prev => ({
              ...prev,
              [toothId]: [...(prev[toothId] || []), serviceId]
            }));
          }}
          onClearSelection={() => {
            console.log('🦷 Очищен выбор зубов');
          }}
        />
      </div>

      {/* Диагноз и заметки */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '1rem',
        marginBottom: '1rem',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
      }}>
        <h3 style={{
          fontSize: '1rem',
          fontWeight: '600',
          color: '#1f2937',
          marginBottom: '0.75rem',
          margin: 0
        }}>
          📝 Диагноз и заметки
        </h3>
        
        <div style={{ marginBottom: '0.75rem' }}>
          <label style={{
            display: 'block',
            fontSize: '0.75rem',
            fontWeight: '500',
            color: '#6b7280',
            marginBottom: '0.25rem'
          }}>
            Диагноз:
          </label>
          <textarea
            value={editingTreatmentPlan.diagnosis || ''}
            onChange={(e) => setEditingTreatmentPlan(prev => prev ? {
              ...prev,
              diagnosis: e.target.value
            } : null)}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '0.875rem',
              resize: 'vertical',
              minHeight: '80px',
              boxSizing: 'border-box'
            }}
            placeholder="Введите диагноз..."
          />
        </div>

        <div>
          <label style={{
            display: 'block',
            fontSize: '0.75rem',
            fontWeight: '500',
            color: '#6b7280',
            marginBottom: '0.25rem'
          }}>
            Заметки врача:
          </label>
          <textarea
            value={editingTreatmentPlan.notes || ''}
            onChange={(e) => setEditingTreatmentPlan(prev => prev ? {
              ...prev,
              notes: e.target.value
            } : null)}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '0.875rem',
              resize: 'vertical',
              minHeight: '80px',
              boxSizing: 'border-box'
            }}
            placeholder="Дополнительные заметки врача..."
          />
        </div>
      </div>

      {/* Кнопки действий */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '1rem',
        marginBottom: '1rem',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          <button
            onClick={saveTreatmentPlan}
            disabled={isSaving}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: isSaving ? '#9ca3af' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
          >
            {isSaving ? '💾 Сохранение...' : '💾 Сохранить план'}
          </button>

          <button
            onClick={() => navigate('/doctor')}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
          >
            ← Вернуться к расписанию
          </button>
        </div>
      </div>

      {/* Модальное окно управления услугами */}
      {selectedToothForServices && (
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
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '400px',
            maxHeight: '80vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Заголовок модального окна */}
            <div style={{
              padding: '1rem',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: '#1f2937',
                margin: 0
              }}>
                🦷 Управление услугами зуба {selectedToothForServices}
              </h3>
              <button
                onClick={() => {
                  setSelectedToothForServices(null);
                  setToothServicesModal([]);
                  setToothServiceStatuses({});
                }}
                style={{
                  padding: '0.5rem',
                  backgroundColor: '#f3f4f6',
                  color: '#6b7280',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                ×
              </button>
            </div>

            {/* Список услуг */}
            <div style={{
              flex: 1,
              overflow: 'auto',
              padding: '1rem'
            }}>
              {toothServicesModal.map(service => (
                <div key={service.id} style={{
                  padding: '0.75rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  marginBottom: '0.75rem',
                  backgroundColor: '#f9fafb'
                }}>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                  }}>
                    <div>
                      <h4 style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#1f2937',
                        margin: 0,
                        marginBottom: '0.25rem'
                      }}>
                        {service.name}
                      </h4>
                      <p style={{
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        margin: 0
                      }}>
                        {service.price} ₸
                      </p>
                    </div>
                    <div style={{
                      display: 'flex',
                      gap: '0.5rem',
                      alignItems: 'center'
                    }}>
                      <select
                        value={toothServiceStatuses[service.id] || 'pending'}
                        onChange={(e) => handleUpdateServiceStatus(selectedToothForServices, service.id, e.target.value)}
                        style={{
                          flex: 1,
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          backgroundColor: 'white'
                        }}
                      >
                        <option value="pending">⏳ В процессе</option>
                        <option value="completed">✅ Выполнено</option>
                      </select>
                      <button
                        onClick={() => handleRemoveServiceFromTooth(selectedToothForServices, service.id)}
                        style={{
                          padding: '0.5rem',
                          backgroundColor: '#fef2f2',
                          color: '#dc2626',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.75rem'
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {toothServicesModal.length === 0 && (
                <div style={{
                  textAlign: 'center',
                  padding: '2rem',
                  color: '#6b7280'
                }}>
                  <p style={{ margin: 0, fontSize: '0.875rem' }}>
                    На этом зубе нет назначенных услуг
                  </p>
                </div>
              )}
            </div>

            {/* Футер модального окна */}
            <div style={{
              padding: '1rem',
              borderTop: '1px solid #e5e7eb',
              backgroundColor: '#f9fafb'
            }}>
              <button
                onClick={() => {
                  setSelectedToothForServices(null);
                  setToothServicesModal([]);
                  setToothServiceStatuses({});
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS для анимации загрузки */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

const TreatmentPlanPage: React.FC = () => {
  const navigate = useNavigate();
  const { planId } = useParams<{ planId: string }>();
  
  const [editingTreatmentPlan, setEditingTreatmentPlan] = useState<TreatmentPlan | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [teethServices, setTeethServices] = useState<Record<number, number[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const teethMapRef = useRef<any>(null);
  
  // Состояние для модального окна управления услугами
  const [selectedToothForServices, setSelectedToothForServices] = useState<number | null>(null);
  const [toothServicesModal, setToothServicesModal] = useState<Service[]>([]);
  const [toothServiceStatuses, setToothServiceStatuses] = useState<Record<number, string>>({});
  
  // Состояние для мобильной версии
  const [isMobileView, setIsMobileView] = useState(isMobile());

  // Обработчик изменения размера окна для мобильной версии
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(isMobile());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Функция для форматирования даты и времени
  const formatDateTime = (dateString: string | null | undefined) => {
    if (!dateString) return 'Не указано';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleString('ru-RU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (error) {
      console.error('Ошибка форматирования даты:', error);
      return 'Неверный формат даты';
    }
  };

  // Обработчик клика по зубу для показа услуг
  const handleToothClick = (toothId: number, toothServices: Service[], serviceStatuses: Record<number, string>) => {
    console.log('🦷 Клик по зубу с услугами:', toothId, toothServices, serviceStatuses);
    setSelectedToothForServices(toothId);
    setToothServicesModal(toothServices);
    setToothServiceStatuses(serviceStatuses);
  };


  // Обработчик обновления статуса услуги
  const handleUpdateServiceStatus = async (toothId: number, serviceId: number, status: string) => {
    try {
      console.log('🔄 Обновляем статус услуги:', { toothId, serviceId, status });
      
      // Находим запись ToothService для этого зуба
      const toothServiceData = editingTreatmentPlan?.toothServicesData?.find(ts => ts.toothId === toothId);
      if (!toothServiceData) {
        console.error('❌ Не найдена запись ToothService для зуба:', toothId);
        return;
      }

      // Обновляем статус через API
      await api.patch(`/tooth-services/${toothServiceData.id}/service/${serviceId}/status`, null, {
        params: { status }
      });

      // Обновляем локальное состояние
      setToothServiceStatuses(prev => ({
        ...prev,
        [serviceId]: status
      }));

      // Обновляем данные в плане лечения
      setEditingTreatmentPlan(prev => {
        if (!prev) return null;
        
        const updatedToothServicesData = prev.toothServicesData?.map(ts => {
          if (ts.toothId === toothId) {
            return {
              ...ts,
              serviceStatuses: {
                ...ts.serviceStatuses,
                [serviceId]: status
              }
            };
          }
          return ts;
        });

        return {
          ...prev,
          toothServicesData: updatedToothServicesData
        };
      });

      console.log('✅ Статус услуги обновлен');
    } catch (error) {
      console.error('❌ Ошибка при обновлении статуса услуги:', error);
    }
  };

  // Обработчик удаления услуги с зуба
  const handleRemoveServiceFromTooth = async (toothId: number, serviceId: number) => {
    try {
      console.log('🗑️ Удаляем услугу с зуба:', { toothId, serviceId });
      
      // Находим запись ToothService для этого зуба
      const toothServiceData = editingTreatmentPlan?.toothServicesData?.find(ts => ts.toothId === toothId);
      if (!toothServiceData) {
        console.error('❌ Не найдена запись ToothService для зуба:', toothId);
        return;
      }

      // Обновляем список услуг, убирая удаляемую
      const updatedServiceIds = toothServiceData.services.filter(s => s.id !== serviceId).map(s => s.id);
      
      // Обновляем через API
      await api.put(`/tooth-services/${toothServiceData.id}`, {
        service_ids: updatedServiceIds,
        service_statuses: Object.fromEntries(
          Object.entries(toothServiceData.serviceStatuses || {}).filter(([id]) => id !== serviceId.toString())
        )
      });

      // Обновляем локальное состояние
      setToothServicesModal(prev => prev.filter(s => s.id !== serviceId));
      setToothServiceStatuses(prev => {
        const newStatuses = { ...prev };
        delete newStatuses[serviceId];
        return newStatuses;
      });

      // Обновляем данные в плане лечения
      setEditingTreatmentPlan(prev => {
        if (!prev) return null;
        
        const updatedToothServicesData = prev.toothServicesData?.map(ts => {
          if (ts.toothId === toothId) {
            return {
              ...ts,
              services: ts.services.filter(s => s.id !== serviceId),
              serviceStatuses: Object.fromEntries(
                Object.entries(ts.serviceStatuses || {}).filter(([id]) => id !== serviceId.toString())
              )
            };
          }
          return ts;
        });

        return {
          ...prev,
          toothServicesData: updatedToothServicesData
        };
      });

      console.log('✅ Услуга удалена с зуба');
    } catch (error) {
      console.error('❌ Ошибка при удалении услуги с зуба:', error);
    }
  };

  // Обработчик изменения услуг на зубах
  const handleToothServicesChange = (newToothServices: any[]) => {
    console.log('🦷 Новые данные о зубах и услугах:', newToothServices);
    
    const newTeethServices: Record<number, number[]> = {};
    newToothServices.forEach(ts => {
      newTeethServices[ts.toothId] = ts.services.map(s => s.id);
    });
    setTeethServices(newTeethServices);
    
    const newSelectedTeeth = newToothServices.map(ts => ts.toothId);
    setEditingTreatmentPlan(prev => prev ? {
      ...prev,
      teethServices: newTeethServices,
      toothServicesData: newToothServices,
      selected_teeth: newSelectedTeeth
    } : null);
  };

  useEffect(() => {
    fetchData();
  }, [planId]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Загружаем услуги
      const servicesRes = await api.get('/services/');
      setServices(servicesRes.data || []);
      
      // Загружаем пациентов
      const patientsRes = await api.get('/patients/');
      setPatients(patientsRes.data?.patients || patientsRes.data || []);
      
      // Загружаем план лечения
      if (planId) {
        const planRes = await api.get(`/treatment-plans/${planId}`);
        const plan = planRes.data;
        
        console.log('📝 Загружен план лечения:', plan);
        
        // Загружаем данные о зубах и услугах
        const toothServicesRes = await api.get(`/tooth-services/treatment-plan/${planId}`);
        const toothServicesData = toothServicesRes.data || [];
        
        console.log('🦷 Загружены данные о зубах и услугах:', toothServicesData);
        
        // Преобразуем данные в нужный формат
        const planTeethServices: Record<number, number[]> = {};
        const toothServicesForMap: any[] = [];
        
        toothServicesData.forEach((toothService: any) => {
          planTeethServices[toothService.tooth_id] = toothService.service_ids;
          
          // Преобразуем в формат для TeethMap
          const servicesForTooth = toothService.service_ids.map((serviceId: number) => 
            services.find(s => s.id === serviceId) || { id: serviceId, name: 'Неизвестная услуга', price: 0, category: '' }
          );
          
          toothServicesForMap.push({
            toothId: toothService.tooth_id,
            services: servicesForTooth,
            serviceStatuses: toothService.service_statuses || {}
          });
        });
        
        console.log('🦷 Преобразованы данные о зубах:', planTeethServices);
        console.log('🦷 Данные для TeethMap:', toothServicesForMap);
        
        // Получаем данные пациента напрямую по ID
        console.log('👤 ID пациента в плане:', plan.patient_id);
        
        let patient = null;
        try {
          const patientRes = await api.get(`/patients/${plan.patient_id}`);
          patient = patientRes.data;
          console.log('👤 Пациент загружен напрямую:', patient);
        } catch (error) {
          console.error('❌ Ошибка при загрузке пациента:', error);
          // Fallback: ищем в загруженном списке пациентов
          const patientsArray = patientsRes.data?.patients || patientsRes.data || [];
          patient = patientsArray.find((p: Patient) => p.id === plan.patient_id);
          console.log('👤 Пациент найден в списке (fallback):', patient);
        }
        
        const planWithDefaults = {
          ...plan,
          patient_name: patient?.full_name || 'Неизвестный пациент',
          patient_allergies: plan.patient_allergies || '',
          patient_chronic_diseases: plan.patient_chronic_diseases || '',
          patient_contraindications: plan.patient_contraindications || '',
          patient_special_notes: plan.patient_special_notes || '',
          services: getPlanServices(plan),
          total_cost: getPlanTotalCost(plan),
          selected_teeth: [], // Очищаем выбранные зубы при загрузке
          teethServices: planTeethServices,
          toothServicesData: toothServicesForMap,
          treated_teeth: plan.treated_teeth || []
        };
        
        console.log('✅ План с дополненными полями:', planWithDefaults);
        setEditingTreatmentPlan(planWithDefaults);
        
        // Инициализируем данные о зубах и услугах
        setTeethServices(planTeethServices);
        
        console.log('🦷 Инициализированы услуги для зубов:', planTeethServices);
      }
      
    } catch (error) {
      console.error('❌ Ошибка при загрузке данных:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Функция для безопасного получения услуг из плана
  const getPlanServices = (plan: TreatmentPlan) => {
    if (plan.services && plan.services.length > 0) {
      return plan.services;
    }
    
    // Извлекаем услуги из teethServices
    const teethServices = plan.teethServices || {};
    const serviceIds = new Set<number>();
    
    Object.values(teethServices).forEach(toothServices => {
      toothServices.forEach(serviceId => serviceIds.add(serviceId));
    });
    
    return Array.from(serviceIds).map(serviceId => 
      services.find(s => s.id === serviceId) || { id: serviceId, name: 'Неизвестная услуга', price: 0 }
    );
  };

  // Функция для безопасного получения общей стоимости плана
  const getPlanTotalCost = (plan: TreatmentPlan) => {
    if (plan.total_cost && plan.total_cost > 0) {
      return plan.total_cost;
    }
    
    // Вычисляем стоимость на основе услуг
    const teethServices = plan.teethServices || {};
    let totalCost = 0;
    
    Object.values(teethServices).forEach(toothServices => {
      toothServices.forEach(serviceId => {
        const service = services.find(s => s.id === serviceId);
        if (service) {
          totalCost += service.price;
        }
      });
    });
    
    return totalCost;
  };

  // Функция для безопасного получения выбранных зубов из плана
  const getPlanSelectedTeeth = (plan: TreatmentPlan) => {
    console.log('🦷 getPlanSelectedTeeth для плана', plan.id, ':', plan.selected_teeth);
    console.log('🦷 Полный план:', plan);
    
    // Если есть selected_teeth, используем их
    if (plan.selected_teeth && plan.selected_teeth.length > 0) {
      console.log('🦷 Возвращаем selected_teeth:', plan.selected_teeth);
      return plan.selected_teeth;
    }
    
    // Иначе извлекаем зубы из teethServices
    const teethServices = plan.teethServices || {};
    const teeth = Object.keys(teethServices).map(Number);
    console.log('🦷 Извлечены зубы из teethServices:', teeth);
    return teeth;
  };

  const saveTreatmentPlan = async () => {
    if (!editingTreatmentPlan) return;
    
    try {
      setIsSaving(true);
      
      // Обновляем план лечения в БД
      const updatedPlan = {
        ...editingTreatmentPlan,
        services: getPlanServices(editingTreatmentPlan),
        total_cost: getPlanTotalCost(editingTreatmentPlan),
        selected_teeth: getPlanSelectedTeeth(editingTreatmentPlan),
        teethServices: editingTreatmentPlan.teethServices || {},
        toothServicesData: editingTreatmentPlan.toothServicesData || []
      };
      
      console.log('💾 Обновляем план лечения:', updatedPlan);
      
      // Обновляем план лечения в БД
      await api.put(`/treatment-plans/${planId}`, {
        diagnosis: updatedPlan.diagnosis,
        notes: updatedPlan.treatment_description || updatedPlan.notes,
        patient_allergies: updatedPlan.patient_allergies,
        patient_chronic_diseases: updatedPlan.patient_chronic_diseases,
        patient_contraindications: updatedPlan.patient_contraindications,
        patient_special_notes: updatedPlan.patient_special_notes,
        status: updatedPlan.status
      });
      
      // Обновляем данные о зубах и услугах в БД
      try {
        // Удаляем старые данные
        await api.delete(`/tooth-services/treatment-plan/${planId}`);
        
        // Создаем новые данные
        const servicesWithTeeth = [];
        for (const [toothId, serviceIds] of Object.entries(teethServices)) {
          if (serviceIds.length > 0) {
            servicesWithTeeth.push({
              treatment_plan_id: parseInt(planId!),
              tooth_id: parseInt(toothId),
              service_ids: serviceIds
            });
          }
        }
        
        // Сохраняем новые данные
        for (const serviceData of servicesWithTeeth) {
          await api.post('/tooth-services/', serviceData);
        }
        
        console.log('✅ План лечения и данные о зубах успешно обновлены в БД');
        
        // Очищаем выбранные зубы после сохранения
        if (teethMapRef.current) {
          teethMapRef.current.resetSelection();
        }
        
        // Обновляем состояние плана, очищая selected_teeth
        setEditingTreatmentPlan(prev => prev ? {
          ...prev,
          selected_teeth: []
        } : null);
        
        // Показываем уведомление об успешном сохранении
        alert('✅ План лечения успешно сохранен!');
        
        // Возвращаемся к предыдущей странице
        navigate(-1);
        
      } catch (error) {
        console.error('❌ Ошибка при обновлении данных о зубах в БД:', error);
      }
      
    } catch (error) {
      console.error('❌ Ошибка при сохранении плана лечения:', error);
      alert('❌ Ошибка при сохранении плана лечения');
    } finally {
      setIsSaving(false);
    }
  };

  const markTeethAsTreated = (toothIds: number[]) => {
    if (!editingTreatmentPlan) return;
    
    const currentTreatedTeeth = editingTreatmentPlan.treated_teeth || [];
    const newTreatedTeeth = [...new Set([...currentTreatedTeeth, ...toothIds])];
    
    setEditingTreatmentPlan({
      ...editingTreatmentPlan,
      treated_teeth: newTreatedTeeth
    });
    
    console.log('✅ Зубы отмечены как вылеченные:', toothIds);
    console.log('🦷 Все вылеченные зубы:', newTreatedTeeth);
  };

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '1.2rem',
        color: '#6b7280'
      }}>
        Загрузка плана лечения...
      </div>
    );
  }

  if (!editingTreatmentPlan) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '1.2rem',
        color: '#ef4444'
      }}>
        План лечения не найден
      </div>
    );
  }

  // Если мобильная версия, рендерим мобильный компонент
  if (isMobileView) {
    return (
      <MobileTreatmentPlanPage
        editingTreatmentPlan={editingTreatmentPlan}
        services={services}
        teethServices={teethServices}
        isLoading={isLoading}
        isSaving={isSaving}
        teethMapRef={teethMapRef}
        selectedToothForServices={selectedToothForServices}
        toothServicesModal={toothServicesModal}
        toothServiceStatuses={toothServiceStatuses}
        formatDateTime={formatDateTime}
        handleToothClick={handleToothClick}
        handleUpdateServiceStatus={handleUpdateServiceStatus}
        handleRemoveServiceFromTooth={handleRemoveServiceFromTooth}
        handleToothServicesChange={handleToothServicesChange}
        saveTreatmentPlan={saveTreatmentPlan}
        navigate={navigate}
        setEditingTreatmentPlan={setEditingTreatmentPlan}
      />
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      padding: '2rem'
    }}>
      {/* Заголовок страницы */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '2rem',
        marginBottom: '2rem',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <div>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: '700',
              color: '#1f2937',
              margin: '0 0 0.5rem 0'
            }}>
              План лечения #{editingTreatmentPlan.id}
            </h1>
            <p style={{
              fontSize: '1.1rem',
              color: '#6b7280',
              margin: 0
            }}>
              Пациент: {editingTreatmentPlan.patient_name}
            </p>
          </div>
          
          <div style={{
            display: 'flex',
            gap: '1rem'
          }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#4b5563';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#6b7280';
              }}
            >
              ← Назад
            </button>
            
            <button
              onClick={saveTreatmentPlan}
              disabled={isSaving}
              style={{
                backgroundColor: isSaving ? '#9ca3af' : '#059669',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (!isSaving) {
                  e.currentTarget.style.backgroundColor = '#047857';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSaving) {
                  e.currentTarget.style.backgroundColor = '#059669';
                }
              }}
            >
              {isSaving ? 'Сохранение...' : '💾 Сохранить'}
            </button>
          </div>
        </div>
        
        {/* Статус плана */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1rem'
        }}>
          <span style={{
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#374151'
          }}>
            Статус:
          </span>
          <select
            value={editingTreatmentPlan.status}
            onChange={(e) => setEditingTreatmentPlan({...editingTreatmentPlan, status: e.target.value})}
            style={{
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '0.875rem',
              backgroundColor: 'white'
            }}
          >
            <option value="active">Активен</option>
            <option value="completed">Завершен</option>
            <option value="cancelled">Отменен</option>
          </select>
        </div>
      </div>

      {/* Основной контент */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '2rem',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {/* Левая колонка - Информация о пациенте и диагноз */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem'
        }}>
          {/* Информация о пациенте */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '2rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: '#1f2937',
              margin: '0 0 1.5rem 0'
            }}>
              👤 Информация о пациенте
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  fontSize: '0.875rem',
                  color: '#374151'
                }}>
                  ФИО пациента:
                </label>
                <input
                  type="text"
                  value={editingTreatmentPlan.patient_name || ''}
                  disabled
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    backgroundColor: '#f9fafb',
                    color: '#6b7280'
                  }}
                />
              </div>
              
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  fontSize: '0.875rem',
                  color: '#374151'
                }}>
                  Дата создания:
                </label>
                <input
                  type="text"
                  value={formatDateTime(editingTreatmentPlan.created_at)}
                  disabled
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    backgroundColor: '#f9fafb',
                    color: '#6b7280'
                  }}
                />
              </div>
              
              {/* Дата изменения */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  fontSize: '0.875rem',
                  color: '#374151'
                }}>
                  Дата изменения:
                </label>
                <input
                  type="text"
                  value={formatDateTime(editingTreatmentPlan.updated_at)}
                  disabled
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    backgroundColor: '#f9fafb',
                    color: '#6b7280'
                  }}
                />
              </div>
            </div>
            
            {/* Анамнез */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  fontSize: '0.875rem',
                  color: '#374151'
                }}>
                  Аллергии:
                </label>
                <textarea
                  value={editingTreatmentPlan.patient_allergies || ''}
                  onChange={(e) => setEditingTreatmentPlan({...editingTreatmentPlan, patient_allergies: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    minHeight: '80px',
                    resize: 'vertical'
                  }}
                  placeholder="Укажите аллергии пациента..."
                />
              </div>
              
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  fontSize: '0.875rem',
                  color: '#374151'
                }}>
                  Хронические заболевания:
                </label>
                <textarea
                  value={editingTreatmentPlan.patient_chronic_diseases || ''}
                  onChange={(e) => setEditingTreatmentPlan({...editingTreatmentPlan, patient_chronic_diseases: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    minHeight: '80px',
                    resize: 'vertical'
                  }}
                  placeholder="Укажите хронические заболевания..."
                />
              </div>
              
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  fontSize: '0.875rem',
                  color: '#374151'
                }}>
                  Противопоказания:
                </label>
                <textarea
                  value={editingTreatmentPlan.patient_contraindications || ''}
                  onChange={(e) => setEditingTreatmentPlan({...editingTreatmentPlan, patient_contraindications: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    minHeight: '80px',
                    resize: 'vertical'
                  }}
                  placeholder="Укажите противопоказания..."
                />
              </div>
              
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  fontSize: '0.875rem',
                  color: '#374151'
                }}>
                  Особые примечания:
                </label>
                <textarea
                  value={editingTreatmentPlan.patient_special_notes || ''}
                  onChange={(e) => setEditingTreatmentPlan({...editingTreatmentPlan, patient_special_notes: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    minHeight: '80px',
                    resize: 'vertical'
                  }}
                  placeholder="Дополнительная информация..."
                />
              </div>
            </div>
          </div>

          {/* Диагноз и описание */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '2rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: '#1f2937',
              margin: '0 0 1.5rem 0'
            }}>
              🩺 Диагноз и лечение
            </h2>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  fontSize: '0.875rem',
                  color: '#374151'
                }}>
                  Диагноз:
                </label>
                <input
                  type="text"
                  value={editingTreatmentPlan.diagnosis}
                  onChange={(e) => setEditingTreatmentPlan({...editingTreatmentPlan, diagnosis: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem'
                  }}
                  placeholder="Введите диагноз..."
                />
              </div>
              
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  fontSize: '0.875rem',
                  color: '#374151'
                }}>
                  Описание лечения:
                </label>
                <textarea
                  value={editingTreatmentPlan.notes}
                  onChange={(e) => setEditingTreatmentPlan({...editingTreatmentPlan, notes: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    minHeight: '120px',
                    resize: 'vertical'
                  }}
                  placeholder="Опишите план лечения..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Правая колонка - Карта зубов и услуги */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem'
        }}>
          {/* Карта зубов */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '2rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: '#1f2937',
              margin: '0 0 1.5rem 0'
            }}>
              🦷 Карта зубов
            </h2>
            
            <TeethMap
              ref={teethMapRef}
              services={services}
              selectedTeeth={editingTreatmentPlan.selected_teeth || []}
              toothServices={editingTreatmentPlan.toothServicesData || []}
              treatedTeeth={editingTreatmentPlan.treated_teeth || []}
              treatmentTeeth={Object.keys(editingTreatmentPlan.teethServices || {}).map(Number)}
              onToothClick={handleToothClick}
              onUpdateServiceStatus={handleUpdateServiceStatus}
              onToothServicesChange={handleToothServicesChange}
              onToothSelect={(toothId) => {
                console.log('🦷 Выбран зуб:', toothId);
                
                if (editingTreatmentPlan) {
                  const currentSelectedTeeth = editingTreatmentPlan.selected_teeth || [];
                  let newSelectedTeeth: number[];
                  
                  if (currentSelectedTeeth.includes(toothId)) {
                    newSelectedTeeth = currentSelectedTeeth.filter(id => id !== toothId);
                  } else {
                    newSelectedTeeth = [...currentSelectedTeeth, toothId];
                  }
                  
                  setEditingTreatmentPlan({
                    ...editingTreatmentPlan,
                    selected_teeth: newSelectedTeeth
                  });
                }
              }}
              onAddServiceToTooth={(toothId, serviceId) => {
                console.log('🦷 Добавлена услуга к зубу:', toothId, serviceId);
                setTeethServices(prev => ({
                  ...prev,
                  [toothId]: [...(prev[toothId] || []), serviceId]
                }));
              }}
              onClearSelection={() => {
                console.log('🦷 Очищен выбор зубов');
              }}
            />
          </div>

          {/* Кнопки действий */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '2rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: '#1f2937',
              margin: '0 0 1.5rem 0'
            }}>
              ⚡ Действия
            </h2>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              
              {/* Кнопка "Создать запись на прием" */}
              {(() => {
                const teethWithServices = Object.keys(editingTreatmentPlan?.teethServices || {}).map(Number);
                const treatedTeeth = editingTreatmentPlan?.treated_teeth || [];
                const untreatedTeeth = teethWithServices.filter(toothId => !treatedTeeth.includes(toothId));
                
                return untreatedTeeth.length > 0 && (
                  <button
                    onClick={() => {
                      console.log('📅 Создание записи на прием для невылеченных зубов:', untreatedTeeth);
                      alert(`📅 Переходим к календарю для создания записи на прием для зубов: ${untreatedTeeth.join(', ')}`);
                      navigate('/doctor');
                    }}
                    style={{
                      backgroundColor: '#2563eb',
                      color: 'white',
                      border: 'none',
                      padding: '1rem 1.5rem',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      fontWeight: '500',
                      boxShadow: '0 2px 4px rgba(37, 99, 235, 0.3)',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#1d4ed8';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#2563eb';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    📅 Создать запись на прием для зубов {untreatedTeeth.join(', ')}
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Модальное окно для управления услугами на зубе */}
      {selectedToothForServices && (
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
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: '#1f2937',
                margin: 0
              }}>
                🦷 Управление услугами зуба {selectedToothForServices}
              </h3>
              <button
                onClick={() => {
                  setSelectedToothForServices(null);
                  setToothServicesModal([]);
                  setToothServiceStatuses({});
                }}
                style={{
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              {toothServicesModal.map(service => (
                <div key={service.id} style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '1rem',
                  backgroundColor: '#f9fafb'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.5rem'
                  }}>
                    <div>
                      <h4 style={{
                        fontSize: '1.1rem',
                        fontWeight: '500',
                        color: '#1f2937',
                        margin: 0
                      }}>
                        {service.name}
                      </h4>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#6b7280',
                        margin: '0.25rem 0 0 0'
                      }}>
                        {service.category} • {service.price} ₸
                      </p>
                    </div>
                    <div style={{
                      display: 'flex',
                      gap: '0.5rem',
                      alignItems: 'center'
                    }}>
                      <select
                        value={toothServiceStatuses[service.id] || 'pending'}
                        onChange={(e) => handleUpdateServiceStatus(selectedToothForServices, service.id, e.target.value)}
                        style={{
                          padding: '0.5rem',
                          borderRadius: '4px',
                          border: '1px solid #d1d5db',
                          backgroundColor: 'white',
                          fontSize: '0.875rem'
                        }}
                      >
                        <option value="pending">⏳ В процессе</option>
                        <option value="completed">✅ Выполнено</option>
                      </select>
                      <button
                        onClick={() => handleRemoveServiceFromTooth(selectedToothForServices, service.id)}
                        style={{
                          backgroundColor: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '0.5rem',
                          cursor: 'pointer',
                          fontSize: '0.875rem'
                        }}
                      >
                        🗑️ Удалить
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {toothServicesModal.length === 0 && (
                <div style={{
                  textAlign: 'center',
                  padding: '2rem',
                  color: '#6b7280'
                }}>
                  <p>На этом зубе нет назначенных услуг</p>
                </div>
              )}
            </div>

            <div style={{
              marginTop: '1.5rem',
              paddingTop: '1rem',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => {
                  setSelectedToothForServices(null);
                  setToothServicesModal([]);
                  setToothServiceStatuses({});
                }}
                style={{
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '500'
                }}
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TreatmentPlanPage;

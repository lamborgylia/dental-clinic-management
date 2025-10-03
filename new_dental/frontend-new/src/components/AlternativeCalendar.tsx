import React, { useState, useEffect, useCallback } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { ru } from 'date-fns/locale';
import { appointmentsApi } from '../services/appointmentsApi';
// Интерфейс Appointment определен локально
interface Appointment {
  id: number;
  patient_id: number;
  doctor_id: number;
  registrar_id: number;
  appointment_datetime: string;
  start_time?: string;
  end_time?: string;
  status: string;
  service_type?: string;
  notes?: string;
  patient_name?: string;
  created_at: string;
  updated_at: string;
}
import AppointmentModal from './AppointmentModal';

interface AlternativeCalendarProps {
  doctorId: number;
  onNavigateToTreatmentPlan?: (patient: any) => void;
}

const AlternativeCalendar: React.FC<AlternativeCalendarProps> = ({ doctorId, onNavigateToTreatmentPlan }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [collapsedDays, setCollapsedDays] = useState<Set<string>>(new Set(['all']));
  const [isMobile, setIsMobile] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');

  // Определение мобильного устройства
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const loadMonthAppointments = useCallback(async () => {
    try {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const startDate = format(monthStart, 'yyyy-MM-dd');
      const endDate = format(monthEnd, 'yyyy-MM-dd');
      console.log('📅 Загружаем записи для месяца:', { startDate, endDate, doctorId });
      const data = await appointmentsApi.getAppointmentsByDateRange(doctorId, startDate, endDate);
      console.log('📋 Загружены записи:', data);
      setAppointments(data);
    } catch (error) {
      console.error('Ошибка загрузки записей месяца:', error);
    }
  }, [currentDate, doctorId]);

  useEffect(() => {
    loadMonthAppointments();
  }, [loadMonthAppointments]);

  // Загружаем записи при изменении месяца
  useEffect(() => {
    loadMonthAppointments();
  }, [currentDate, loadMonthAppointments]);

  // Получение дней календаря
  const calendarDays = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 })
  });

  // Обработка клика по дате
  const handleDateClick = (date: Date) => {
    if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
      setSelectedStartDate(date);
      setSelectedEndDate(null);
    } else if (selectedStartDate && !selectedEndDate) {
      if (date < selectedStartDate) {
        setSelectedStartDate(date);
        setSelectedEndDate(selectedStartDate);
      } else {
        setSelectedEndDate(date);
      }
    }
  };

  // Загрузка записей для выбранного периода
  const loadAppointments = async () => {
    if (!selectedStartDate) return;

    setLoading(true);
    try {
      const startDate = format(selectedStartDate, 'yyyy-MM-dd');
      const endDate = selectedEndDate ? format(selectedEndDate, 'yyyy-MM-dd') : startDate;
      
      const data = await appointmentsApi.getAppointmentsByDateRange(doctorId, startDate, endDate);
      setAppointments(data);
      
      // Сворачиваем все дни после загрузки записей
      setCollapsedDays(new Set(['all']));
    } catch (error) {
      console.error('Ошибка загрузки записей:', error);
    } finally {
      setLoading(false);
    }
  };

  // Очистка выбора
  const clearSelection = () => {
    setSelectedStartDate(null);
    setSelectedEndDate(null);
    setAppointments([]);
    setCollapsedDays(new Set(['all']));
  };

  // Получение выбранных дней
  const getSelectedDays = () => {
    if (!selectedStartDate) return [];
    if (!selectedEndDate) return [selectedStartDate];
    
    return eachDayOfInterval({ start: selectedStartDate, end: selectedEndDate });
  };

  // Получение записей для конкретного дня
  const getAppointmentsForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayAppointments = appointments.filter(apt => {
      const aptDate = format(new Date(apt.appointment_datetime), 'yyyy-MM-dd');
      return aptDate === dateStr;
    });
    if (dayAppointments.length > 0) {
      console.log(`📅 Записи на ${dateStr}:`, dayAppointments);
    }
    return dayAppointments;
  };

  // Генерация слотов времени
  const getTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 18; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      if (hour < 18) {
        slots.push(`${hour.toString().padStart(2, '0')}:30`);
      }
    }
    return slots;
  };

  // Получение записи в конкретное время
  const getAppointmentAtTime = (date: Date, time: string) => {
    const dayAppointments = getAppointmentsForDay(date);
    return dayAppointments.find(apt => {
      const aptTime = format(new Date(apt.appointment_datetime), 'HH:mm');
      const aptStartTime = apt.start_time ? apt.start_time.substring(0, 5) : null;
      return aptTime === time || aptStartTime === time;
    });
  };

  // Обработка клика по времени
  const handleTimeClick = (date: Date, time: string) => {
    const appointment = getAppointmentAtTime(date, time);
    setSelectedDate(date);
    setSelectedTime(time);
    if (appointment) {
      setEditingAppointment(appointment);
    } else {
      setEditingAppointment(null);
    }
    setShowAppointmentModal(true);
  };

  // Проверка, находится ли дата в выбранном диапазоне
  const isDateInRange = (date: Date) => {
    if (!selectedStartDate) return false;
    if (!selectedEndDate) return isSameDay(date, selectedStartDate);
    return date >= selectedStartDate && date <= selectedEndDate;
  };

  // Управление сворачиванием дней
  const toggleDayCollapse = (dateStr: string) => {
    const newCollapsed = new Set(collapsedDays);
    if (newCollapsed.has('all')) {
      newCollapsed.delete('all');
      getSelectedDays().forEach(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        if (dayStr !== dateStr) {
          newCollapsed.add(dayStr);
        }
      });
    } else {
      if (newCollapsed.has(dateStr)) {
        newCollapsed.delete(dateStr);
      } else {
        newCollapsed.add(dateStr);
      }
    }
    setCollapsedDays(newCollapsed);
  };

  const isDayCollapsed = (dateStr: string) => {
    if (collapsedDays.has('all')) {
      return true;
    }
    return collapsedDays.has(dateStr);
  };

  // Проверка выбранности даты
  const isDateSelected = (date: Date) => {
    return (selectedStartDate && isSameDay(date, selectedStartDate)) ||
           (selectedEndDate && isSameDay(date, selectedEndDate));
  };

  return (
    <div style={{ 
      padding: isMobile ? '8px' : '10px 20px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: 'auto',
      borderRadius: isMobile ? '0' : '20px',
      boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
      marginTop: 0
    }}>
      {/* Единая компоновка с CSS */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? '0' : '20px',
        alignItems: isMobile ? 'stretch' : 'flex-start'
      }}>
        {/* Левая часть - календарь */}
        <div style={{
          flex: isMobile ? 'none' : '0 0 400px',
          background: 'rgba(255,255,255,0.95)',
          borderRadius: '20px',
          padding: '20px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
          marginBottom: isMobile ? '20px' : '0',
          order: isMobile ? 1 : 0
        }}>
          {/* Заголовок календаря */}
          <div style={{
            textAlign: 'center',
            marginBottom: '20px',
            color: '#333'
          }}>
            <h1 style={{
              fontSize: isMobile ? '24px' : '22px',
              fontWeight: '700',
              marginBottom: '10px'
            }}>
              Альтернативный календарь
            </h1>
            <p style={{
              fontSize: isMobile ? '14px' : '16px',
              opacity: 0.7,
              margin: 0
            }}>
              Выберите диапазон дат для просмотра записей
            </p>
          </div>

          {/* Навигация по месяцам */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            background: '#f8f9fa',
            padding: '15px',
            borderRadius: '15px'
          }}>
            <button
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              style={{
                background: '#e9ecef',
                border: 'none',
                color: '#333',
                padding: '8px 16px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.3s ease'
              }}
            >
              ← Предыдущий
            </button>
            
            <h2 style={{
              color: '#333',
              fontSize: '18px',
              fontWeight: '600',
              margin: 0
            }}>
              {format(currentDate, 'MMMM yyyy', { locale: ru })}
            </h2>
            
            <button
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              style={{
                background: '#e9ecef',
                border: 'none',
                color: '#333',
                padding: '8px 16px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.3s ease'
              }}
            >
              Следующий →
            </button>
          </div>

          {/* Календарная сетка */}
          <div style={{
            background: 'white',
            borderRadius: '15px',
            padding: '15px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
          }}>
            {/* Дни недели */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '4px',
              marginBottom: '10px'
            }}>
              {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
                <div key={day} style={{
                  textAlign: 'center',
                  fontWeight: '600',
                  color: '#666',
                  fontSize: '12px',
                  padding: '8px 0'
                }}>
                  {day}
                </div>
              ))}
            </div>

            {/* Дни месяца */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '4px'
            }}>
              {calendarDays.map(day => {
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isInRange = isDateInRange(day);
                const isSelected = isDateSelected(day);
                const dayAppointments = getAppointmentsForDay(day);
                const hasAppointments = dayAppointments.length > 0;

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => handleDateClick(day)}
                    style={{
                      aspectRatio: '1',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '500',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                      minHeight: '40px',
                      background: isSelected 
                        ? 'linear-gradient(135deg, #ff6b6b, #ee5a24)' 
                        : isInRange 
                          ? 'linear-gradient(135deg, #74b9ff, #0984e3)'
                          : isCurrentMonth 
                            ? '#f8f9fa' 
                            : '#e9ecef',
                      color: isSelected || isInRange 
                        ? 'white' 
                        : isCurrentMonth 
                          ? '#333' 
                          : '#999',
                      boxShadow: isSelected || isInRange 
                        ? '0 4px 15px rgba(0,0,0,0.2)' 
                        : '0 2px 8px rgba(0,0,0,0.1)',
                      transform: isSelected || isInRange ? 'scale(1.05)' : 'scale(1)'
                    }}
                  >
                    {format(day, 'd')}
                    {hasAppointments && (
                      <div style={{
                        position: 'absolute',
                        top: '2px',
                        right: '2px',
                        width: '6px',
                        height: '6px',
                        background: '#ff6b6b',
                        borderRadius: '50%',
                        boxShadow: '0 0 4px rgba(255,107,107,0.6)'
                      }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Кнопки действий */}
          {selectedStartDate && (
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <button
                onClick={loadAppointments}
                disabled={loading}
                style={{
                  background: 'linear-gradient(135deg, #00b894, #00a085)',
                  border: 'none',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '25px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(0,184,148,0.3)',
                  opacity: loading ? 0.7 : 1,
                  marginRight: '10px'
                }}
              >
                {loading ? 'Загрузка...' : 'Просмотр записей'}
              </button>
              
              <button
                onClick={clearSelection}
                style={{
                  background: '#6c757d',
                  border: 'none',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '25px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                Очистить выбор
              </button>
            </div>
          )}
        </div>

        {/* Правая часть - результаты */}
        <div style={{
          flex: isMobile ? 'none' : '1',
          background: 'rgba(255,255,255,0.95)',
          borderRadius: '20px',
          padding: '20px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
          order: isMobile ? 2 : 1
        }}>
          {selectedStartDate ? (
            <div>
              <h3 style={{
                textAlign: 'center',
                marginBottom: '25px',
                color: '#333',
                fontSize: '20px',
                fontWeight: '600'
              }}>
                Записи на выбранные дни
              </h3>

              {getSelectedDays().map(date => {
                const dateStr = format(date, 'yyyy-MM-dd');
                const dayAppointments = getAppointmentsForDay(date);
                const isCollapsed = isDayCollapsed(dateStr);

                return (
                  <div key={dateStr} style={{
                    marginBottom: '20px',
                    border: '1px solid #e9ecef',
                    borderRadius: '15px',
                    overflow: 'hidden',
                    background: 'white',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}>
                    {/* Заголовок дня */}
                    <div
                      onClick={() => toggleDayCollapse(dateStr)}
                      style={{
                        background: 'linear-gradient(135deg, #667eea, #764ba2)',
                        color: 'white',
                        padding: '15px 20px',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <div>
                        <h4 style={{
                          margin: 0,
                          fontSize: '16px',
                          fontWeight: '600'
                        }}>
                          {format(date, 'dd MMMM yyyy', { locale: ru })}
                        </h4>
                        <p style={{
                          margin: '5px 0 0 0',
                          fontSize: '12px',
                          opacity: 0.9
                        }}>
                          {dayAppointments.length} записей
                        </p>
                      </div>
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        style={{
                          transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                          transition: 'transform 0.3s ease'
                        }}
                      >
                        <polyline points="6,9 12,15 18,9"></polyline>
                      </svg>
                    </div>

                    {/* Слоты времени */}
                    {!isCollapsed && (
                      <div style={{
                        padding: '15px',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: '12px'
                      }}>
                        {getTimeSlots().map(time => {
                          const appointment = getAppointmentAtTime(date, time);
                          const isBooked = !!appointment;

                          return (
                            <div
                              key={time}
                              onClick={() => handleTimeClick(date, time)}
                              style={{
                                padding: '12px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                border: '1px solid #e9ecef',
                                background: isBooked ? '#fff5f5' : '#f8f9fa',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                minHeight: '48px'
                              }}
                            >
                              <span style={{
                                fontWeight: '600',
                                color: '#333',
                                flexShrink: 0,
                                minWidth: '60px',
                                fontSize: '14px'
                              }}>
                                {time}
                              </span>
                              {isBooked ? (
                                <div style={{
                                  fontSize: '12px',
                                  padding: '3px 6px',
                                  borderRadius: '6px',
                                  background: '#ff6b6b',
                                  color: 'white',
                                  flex: 1,
                                  textAlign: 'left',
                                  maxWidth: '70%',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {appointment?.patient_name || 'Пациент'}
                                </div>
                              ) : (
                                <div style={{
                                  fontSize: '14px',
                                  padding: '4px 8px',
                                  borderRadius: '8px',
                                  background: '#e9ecef',
                                  color: '#6c757d'
                                }}>
                                  Свободно
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: '#666'
            }}>
              <h3 style={{
                fontSize: '18px',
                marginBottom: '10px',
                color: '#333'
              }}>
                Выберите дату
              </h3>
              <p style={{
                fontSize: '14px',
                margin: 0
              }}>
                Нажмите на даты, чтобы просмотреть записи
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Модальное окно записи */}
      {showAppointmentModal && selectedDate && selectedTime && (
        <AppointmentModal
          isOpen={showAppointmentModal}
          onClose={() => {
            setShowAppointmentModal(false);
            setEditingAppointment(null);
            setSelectedDate(null);
            setSelectedTime('');
            loadAppointments(); // Перезагружаем записи
          }}
          date={selectedDate}
          time={selectedTime}
          appointment={editingAppointment as any}
          doctorId={doctorId}
          onAppointmentCreated={() => {
            setShowAppointmentModal(false);
            setEditingAppointment(null);
            setSelectedDate(null);
            setSelectedTime('');
            loadAppointments(); // Reload appointments
          }}
          onAppointmentUpdated={() => {
            setShowAppointmentModal(false);
            setEditingAppointment(null);
            setSelectedDate(null);
            setSelectedTime('');
            loadAppointments(); // Reload appointments
          }}
          onNavigateToTreatmentPlan={onNavigateToTreatmentPlan}
        />
      )}
    </div>
  );
};

export default AlternativeCalendar;
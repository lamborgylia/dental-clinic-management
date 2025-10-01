import React, { useState, useEffect } from 'react';
import AppointmentModal from './AppointmentModal';
import { appointmentsApi } from '../services/appointmentsApi';
// import type { Appointment as ApiAppointment } from '../services/appointmentsApi';

// Интерфейс для отображения в календаре (с дополнительными полями для удобства)
interface Appointment {
  id: number;
  patient_id: number;
  patient_name: string;
  patient_phone: string;
  patient_iin: string;
  patient_birth_date: string;
  patient_allergies: string;
  patient_chronic_diseases: string;
  patient_contraindications: string;
  patient_special_notes: string;
  doctor_id: number;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  notes: string;
}



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
  created_at: string;
}

interface AppointmentCalendarProps {
  doctorId: number;
  treatmentPlanForAppointment?: {
    plan: any;
    teethServices: Record<number, number[]>;
  } | null;
  onAppointmentCreated?: (appointment: Appointment) => void;
  onAppointmentUpdated?: (appointment: Appointment) => void;
  onNavigateToTreatmentPlan?: (patient: Patient) => void;
  onCreateTreatmentPlan?: (patient: Patient) => void;
}

const AppointmentCalendar: React.FC<AppointmentCalendarProps> = ({
  doctorId,
  treatmentPlanForAppointment,
  onAppointmentCreated,
  onAppointmentUpdated,
  onNavigateToTreatmentPlan,
  onCreateTreatmentPlan
}): React.JSX.Element => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Отладочные логи для состояния модала
  useEffect(() => {
    console.log('🔍 Состояние модала изменилось:', { 
      isModalOpen, 
      selectedDate, 
      selectedTime, 
      editingAppointment 
    });
  }, [isModalOpen, selectedDate, selectedTime, editingAppointment]);

  // Рабочие часы (8:00 - 18:00)
  const workingHours = Array.from({ length: 10 }, (_, i) => i + 8);
  
  // Получаем текущую неделю (начинается с понедельника)
  const getWeekDates = (date: Date) => {
    const start = new Date(date);
    const day = start.getDay();
    // 0 = воскресенье, 1 = понедельник, ..., 6 = суббота
    // Вычисляем понедельник текущей недели
    const mondayOffset = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + mondayOffset);
    
    const week = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      week.push(day);
    }
    return week;
  };

  // Навигация по неделям
  const goToPreviousWeek = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() - 7);
      return newDate;
    });
  };

  const goToNextWeek = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + 7);
      return newDate;
    });
  };


  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Проверяем, есть ли запись на определенное время
  const getAppointmentAtTime = (date: Date, time: string) => {
    const dateStr = date.toISOString().split('T')[0];
    const appointment = appointments.find(apt => 
      apt.appointment_date === dateStr && apt.start_time === time
    );
    if (appointment) {
      console.log('🎯 Найдена запись на', dateStr, time, ':', appointment.patient_name);
    }
    return appointment;
  };

  // Обработчик клика по времени
  const handleTimeClick = (date: Date, time: string) => {
    console.log('🕐 handleTimeClick вызван:', { date, time });
    
    const appointment = getAppointmentAtTime(date, time);
    console.log('📅 Найдена запись:', appointment);
    
    if (appointment) {
      // Редактирование существующей записи
      console.log('✏️ Редактирование существующей записи');
      setEditingAppointment(appointment);
      setSelectedDate(date);
      setSelectedTime(time);
    } else {
      // Создание новой записи
      console.log('➕ Создание новой записи');
      setEditingAppointment(null);
      setSelectedDate(date);
      setSelectedTime(time);
    }
    
    console.log('🚀 Открываем модал, isModalOpen = true');
    setIsModalOpen(true);
    
    // Проверяем состояние через небольшую задержку
    setTimeout(() => {
      console.log('🔍 Состояние модала:', { isModalOpen, selectedDate, selectedTime });
    }, 100);
  };

  // Загрузка записей на прием
  useEffect(() => {
    fetchAppointments();
  }, [currentDate, doctorId]);

  const fetchAppointments = async () => {
    try {
      console.log('🔄 Загружаем записи для врача:', doctorId);
      const apiAppointments = await appointmentsApi.getByDoctorId(doctorId);
      console.log('✅ Загружены записи из API:', apiAppointments);
      console.log('📊 Количество записей:', apiAppointments.length);
      
      // Преобразуем данные из API в формат для календаря
      const calendarAppointments: Appointment[] = apiAppointments.map(apiApp => {
        const appointmentDateTime = new Date(apiApp.appointment_datetime);
        const date = appointmentDateTime.toISOString().split('T')[0];
        const time = appointmentDateTime.toTimeString().slice(0, 5);
        
        return {
          id: apiApp.id,
          patient_id: apiApp.patient_id,
          patient_name: apiApp.patient_name || 'Неизвестный пациент',
          patient_phone: apiApp.patient_phone || '',
          patient_iin: apiApp.patient_iin || '',
          patient_birth_date: apiApp.patient_birth_date || '',
          patient_allergies: apiApp.patient_allergies || '',
          patient_chronic_diseases: apiApp.patient_chronic_diseases || '',
          patient_contraindications: apiApp.patient_contraindications || '',
          patient_special_notes: apiApp.patient_special_notes || '',
          doctor_id: apiApp.doctor_id,
          appointment_date: date,
          start_time: time,
          end_time: time, // Пока используем то же время, можно добавить логику для расчета времени окончания
          status: apiApp.status,
          notes: apiApp.notes || ''
        };
      });
      
      console.log('✅ Преобразованные записи для календаря:', calendarAppointments);
      console.log('📅 Записи по датам:');
      calendarAppointments.forEach(apt => {
        console.log(`  ${apt.appointment_date} ${apt.start_time} - ${apt.patient_name}`);
      });
      setAppointments(calendarAppointments);
      setLoading(false);
    } catch (error) {
      console.error('❌ Ошибка загрузки записей:', error);
      setLoading(false);
    }
  };

  const weekDates = getWeekDates(currentDate);
  
  // Отладочная информация о текущей неделе
  useEffect(() => {
    console.log('📅 Текущая неделя:', weekDates.map(d => d.toISOString().split('T')[0]));
  }, [weekDates]);

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div>Загрузка календаря...</div>
      </div>
    );
  }

  return (
    <div style={{ 
      backgroundColor: 'white', 
      borderRadius: '0.5rem', 
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      overflow: 'hidden'
    }}>
      {/* Заголовок календаря */}
      <div style={{
        backgroundColor: '#f8fafc',
        padding: '1rem',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>

        
        <div style={{ 
          display: 'flex', 
          gap: '0.5rem',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={goToPreviousWeek}
            style={{
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              padding: 'clamp(0.4rem, 1.5vw, 0.5rem) clamp(0.6rem, 2vw, 0.75rem)',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontSize: 'clamp(0.7rem, 2vw, 0.875rem)',
              whiteSpace: 'nowrap',
              minWidth: 'fit-content'
            }}
          >
            ← Предыдущая
          </button>
          
          <button
            onClick={goToToday}
            style={{
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              padding: 'clamp(0.4rem, 1.5vw, 0.5rem) clamp(0.6rem, 2vw, 0.75rem)',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontSize: 'clamp(0.7rem, 2vw, 0.875rem)',
              whiteSpace: 'nowrap',
              minWidth: 'fit-content'
          }}>
            Сегодня
          </button>
          
          <button
            onClick={goToNextWeek}
            style={{
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              padding: 'clamp(0.4rem, 1.5vw, 0.5rem) clamp(0.6rem, 2vw, 0.75rem)',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontSize: 'clamp(0.7rem, 2vw, 0.875rem)',
              whiteSpace: 'nowrap',
              minWidth: 'fit-content'
            }}
          >
            Следующая →
          </button>
        </div>
      </div>

      <div style={{ 
        overflowX: 'auto',
        padding: 'clamp(0.5rem, 1.5vw, 1rem)'
      }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'clamp(80px, 15vw, 120px) repeat(7, minmax(80px, 1fr))',
          minWidth: 'clamp(600px, 90vw, 900px)',
          gap: '1px',
          backgroundColor: '#e2e8f0'
        }}>
          {/* Заголовки дней */}
          <div style={{ 
            backgroundColor: '#f8fafc', 
            padding: 'clamp(0.5rem, 1.5vw, 0.75rem)',
            fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
            fontWeight: '500',
            color: '#374151',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            Время
          </div>
          
          {weekDates.map((date, index) => (
            <div key={index} style={{ 
              backgroundColor: '#f8fafc', 
              padding: 'clamp(0.5rem, 1.5vw, 0.75rem)',
              textAlign: 'center',
              fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 'clamp(60px, 8vw, 80px)'
            }}>
              <div style={{ 
                fontWeight: '500', 
                color: '#111827',
                marginBottom: 'clamp(0.125rem, 0.5vw, 0.25rem)',
                fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)'
              }}>
                {date.toLocaleDateString('ru-RU', { weekday: 'short' })}
              </div>
              <div style={{ 
                color: date.toDateString() === new Date().toDateString() ? '#2563eb' : '#6b7280',
                fontWeight: date.toDateString() === new Date().toDateString() ? '600' : '400',
                fontSize: 'clamp(0.9rem, 2.2vw, 1.1rem)'
              }}>
                {date.getDate()}
              </div>
            </div>
          ))}

          {/* Временные слоты */}
          {workingHours.map(hour => {
            const time = `${hour.toString().padStart(2, '0')}:00`;
            
            return (
              <React.Fragment key={hour}>
                {/* Время */}
                <div style={{ 
                  backgroundColor: '#f8fafc', 
                  padding: 'clamp(0.25rem, 1vw, 0.5rem)',
                  fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)',
                  color: '#6b7280',
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                                          minHeight: 'clamp(70px, 10vw, 80px)',
                  fontWeight: '500'
                }}>
                  {time}
                </div>
                
                {/* Ячейки для каждого дня */}
                {weekDates.map((date, dayIndex) => {
                  const appointment = getAppointmentAtTime(date, time);
                  
                  return (
                    <div
                      key={`${dayIndex}-${hour}`}
                      onClick={() => handleTimeClick(date, time)}
                      style={{
                        padding: 'clamp(0.25rem, 1vw, 0.5rem)',
                        cursor: 'pointer',
                        minHeight: 'clamp(70px, 10vw, 80px)',
                        backgroundColor: appointment ? '#fef3c7' : 'white',
                        border: appointment ? '2px solid #f59e0b' : 'none',
                        position: 'relative',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 'clamp(0.6rem, 1.5vw, 0.75rem)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = appointment ? '#fde68a' : '#f8fafc';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = appointment ? '#fef3c7' : 'white';
                      }}
                    >
                      {appointment ? (
                        <div style={{ 
                          fontSize: 'clamp(0.6rem, 1.5vw, 0.75rem)',
                          color: '#92400e',
                          lineHeight: '1.2',
                          textAlign: 'center',
                          width: '100%',
                          overflow: 'hidden'
                        }}>
                          <div style={{ 
                            fontWeight: '600', 
                            marginBottom: 'clamp(0.125rem, 0.5vw, 0.25rem)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            fontSize: 'clamp(0.55rem, 1.3vw, 0.7rem)'
                          }}>
                            {appointment.patient_name}
                          </div>
                          <div style={{ 
                            fontSize: 'clamp(0.5rem, 1.2vw, 0.65rem)',
                            fontWeight: '600',
                            color: '#ea580c',
                            marginBottom: 'clamp(0.125rem, 0.5vw, 0.25rem)'
                          }}>
                            {appointment.start_time}-{appointment.end_time}
                          </div>
                          <div style={{ 
                            fontSize: 'clamp(0.45rem, 1vw, 0.6rem)',
                            color: '#6b7280',
                            marginBottom: 'clamp(0.125rem, 0.5vw, 0.25rem)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            📱 {appointment.patient_phone}
                          </div>
                          {appointment.patient_allergies && (
                            <div style={{ 
                              fontSize: 'clamp(0.4rem, 0.9vw, 0.55rem)',
                              color: '#dc2626',
                              fontWeight: '500',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              ⚠️ Аллергии
                            </div>
                          )}
                          {appointment.notes && (
                            <div style={{ 
                              fontSize: 'clamp(0.45rem, 1vw, 0.6rem)',
                              color: '#6b7280',
                              fontStyle: 'italic',
                              marginTop: 'clamp(0.125rem, 0.5vw, 0.25rem)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              📝 {appointment.notes}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={{ 
                          fontSize: 'clamp(1.2rem, 3vw, 1.5rem)',
                          color: '#9ca3af',
                          textAlign: 'center',
                          fontWeight: '300',
                          userSelect: 'none'
                        }}>
                          +
                        </div>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Модал записи на прием */}
      {console.log('🎭 Рендер модала:', { isModalOpen, selectedDate, selectedTime })}
      {isModalOpen && selectedDate && selectedTime && (
        <AppointmentModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedDate(null);
            setSelectedTime(null);
            setEditingAppointment(null);
          }}
          date={selectedDate}
          time={selectedTime}
          appointment={editingAppointment}
          doctorId={doctorId}
          treatmentPlanForAppointment={treatmentPlanForAppointment}
          onAppointmentCreated={(appointment) => {
            setAppointments(prev => [...prev, appointment]);
            onAppointmentCreated?.(appointment);
            setIsModalOpen(false);
          }}
          onAppointmentUpdated={(appointment) => {
            setAppointments(prev => 
              prev.map(apt => apt.id === appointment.id ? appointment : apt)
            );
            onAppointmentUpdated?.(appointment);
            setIsModalOpen(false);
          }}
          onNavigateToTreatmentPlan={onNavigateToTreatmentPlan}
          onCreateTreatmentPlan={onCreateTreatmentPlan}
        />
      )}
    </div>
  );
};

export default AppointmentCalendar;

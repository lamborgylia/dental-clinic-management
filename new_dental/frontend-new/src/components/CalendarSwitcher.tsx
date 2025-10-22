import React, { useState } from 'react';
import AppointmentCalendar from './AppointmentCalendar';
import AlternativeCalendar from './AlternativeCalendar';

interface CalendarSwitcherProps {
  doctorId: number;
  onNavigateToTreatmentPlan?: (patient: any) => void;
  onCreateTreatmentPlan?: (patient: any) => void;
  onAppointmentCreated?: (appointment: any) => void;
  onAppointmentUpdated?: (appointment: any) => void;
}

const CalendarSwitcher: React.FC<CalendarSwitcherProps> = ({ 
  doctorId, 
  onNavigateToTreatmentPlan, 
  onCreateTreatmentPlan,
  onAppointmentCreated,
  onAppointmentUpdated
}) => {
  const [calendarType, setCalendarType] = useState<'weekly' | 'monthly'>('weekly');

  return (
    <div style={{ paddingTop: 0 }}>
      {/* Переключатель календарей */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        marginTop: 0,
        marginBottom: '8px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '15px',
        padding: '4px 8px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
      }}>
        <button
          onClick={() => setCalendarType('weekly')}
          style={{
            background: calendarType === 'weekly' 
              ? 'rgba(255,255,255,0.9)' 
              : 'transparent',
            border: 'none',
            color: calendarType === 'weekly' ? '#333' : 'white',
            padding: '12px 24px',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'all 0.3s ease',
            marginRight: '8px'
          }}
          onMouseEnter={(e) => {
            if (calendarType !== 'weekly') {
              e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
            }
          }}
          onMouseLeave={(e) => {
            if (calendarType !== 'weekly') {
              e.currentTarget.style.background = 'transparent';
            }
          }}
        >
          📅 Недельный календарь
        </button>
        
        <button
          onClick={() => setCalendarType('monthly')}
          style={{
            background: calendarType === 'monthly' 
              ? 'rgba(255,255,255,0.9)' 
              : 'transparent',
            border: 'none',
            color: calendarType === 'monthly' ? '#333' : 'white',
            padding: '12px 24px',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            if (calendarType !== 'monthly') {
              e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
            }
          }}
          onMouseLeave={(e) => {
            if (calendarType !== 'monthly') {
              e.currentTarget.style.background = 'transparent';
            }
          }}
        >
          🗓️ Месячный календарь
        </button>
      </div>

      {/* Отображение выбранного календаря */}
      {calendarType === 'weekly' ? (
        <AppointmentCalendar 
          doctorId={doctorId} 
          onCreateTreatmentPlan={onCreateTreatmentPlan}
          onAppointmentCreated={onAppointmentCreated}
          onAppointmentUpdated={onAppointmentUpdated}
        />
      ) : (
        <AlternativeCalendar 
          doctorId={doctorId} 
          onNavigateToTreatmentPlan={onNavigateToTreatmentPlan} 
        />
      )}
    </div>
  );
};

export default CalendarSwitcher;

import React from 'react';
import jsPDF from 'jspdf';
import type { TreatmentOrder } from '../types/treatmentOrder';

interface Patient {
  id: number;
  full_name: string;
  phone: string;
  iin: string;
  birth_date?: string;
}

interface Service {
  id: number;
  name: string;
  price: number;
  description?: string;
}

interface TreatmentOrderPDFGeneratorProps {
  treatmentOrder: TreatmentOrder;
  patient: Patient;
  services: Service[];
}

const TreatmentOrderPDFGenerator: React.FC<TreatmentOrderPDFGeneratorProps> = ({
  treatmentOrder,
  patient,
  services
}) => {
  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Заголовок документа
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('НАРЯД НА ВЫПОЛНЕНИЕ СТОМАТОЛОГИЧЕСКИХ УСЛУГ', 20, 30);
    
    // Линия под заголовком
    doc.setLineWidth(0.5);
    doc.line(20, 35, 190, 35);
    
    // Информация о клинике
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Стоматологическая клиника "DentalCare"', 20, 50);
    doc.text('Адрес: г. Алматы, ул. Абая, 150', 20, 58);
    doc.text('Телефон: +7 (727) 123-45-67', 20, 66);
    
    // Информация о пациенте
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('ДАННЫЕ ПАЦИЕНТА:', 20, 85);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`ФИО: ${patient.full_name}`, 20, 95);
    doc.text(`ИИН: ${patient.iin}`, 20, 103);
    doc.text(`Телефон: ${patient.phone}`, 20, 111);
    doc.text(`Дата рождения: ${patient.birth_date}`, 20, 119);
    
    // Информация о наряде
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('ИНФОРМАЦИЯ О НАРЯДЕ:', 20, 140);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Номер наряда: #${treatmentOrder.id}`, 20, 150);
    doc.text(`Дата создания: ${new Date(treatmentOrder.created_at).toLocaleDateString('ru-RU')}`, 20, 158);
    doc.text(`Статус: ${treatmentOrder.status}`, 20, 166);
    
    // Услуги
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('ПЕРЕЧЕНЬ УСЛУГ:', 20, 185);
    
    // Заголовки таблицы
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('№', 20, 195);
    doc.text('Наименование услуги', 35, 195);
    doc.text('Количество', 120, 195);
    doc.text('Цена за ед.', 150, 195);
    doc.text('Сумма', 175, 195);
    
    // Линия под заголовками
    doc.setLineWidth(0.3);
    doc.line(20, 197, 190, 197);
    
    let yPosition = 205;
    let totalAmount = 0;
    
    doc.setFont('helvetica', 'normal');
    
    treatmentOrder.services.forEach((serviceItem, index) => {
      const service = services.find(s => s.id === serviceItem.service_id);
      if (service) {
        const amount = serviceItem.quantity * Number(service.price);
        totalAmount += amount;
        
        doc.text((index + 1).toString(), 20, yPosition);
        doc.text(service.name, 35, yPosition);
        doc.text(serviceItem.quantity.toString(), 120, yPosition);
        doc.text(`${Number(service.price).toLocaleString()} ₸`, 150, yPosition);
        doc.text(`${amount.toLocaleString()} ₸`, 175, yPosition);
        
        yPosition += 8;
      }
    });
    
    // Итоговая сумма
    doc.setLineWidth(0.3);
    doc.line(20, yPosition + 5, 190, yPosition + 5);
    
    doc.setFont('helvetica', 'bold');
    doc.text('ИТОГО:', 150, yPosition + 15);
    doc.text(`${totalAmount.toLocaleString()} ₸`, 175, yPosition + 15);
    
    // Подписи
    yPosition += 40;
    doc.setFont('helvetica', 'normal');
    doc.text('Врач: _________________', 20, yPosition);
    doc.text('Дата: _________________', 120, yPosition);
    
    yPosition += 20;
    doc.text('Пациент: _________________', 20, yPosition);
    doc.text('Дата: _________________', 120, yPosition);
    
    // Сохранение файла
    const fileName = `Наряд_${treatmentOrder.id}_${patient.full_name.replace(/\s+/g, '_')}.pdf`;
    doc.save(fileName);
  };

  return (
    <button
      onClick={generatePDF}
      style={{
        backgroundColor: '#dc2626',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        padding: '12px 24px',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'all 0.2s ease',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.backgroundColor = '#b91c1c';
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.backgroundColor = '#dc2626';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
      }}
    >
      📄 Создать документ
    </button>
  );
};

export default TreatmentOrderPDFGenerator;

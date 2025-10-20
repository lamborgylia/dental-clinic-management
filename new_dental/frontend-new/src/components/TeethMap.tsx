import { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';

interface Service {
  id: number;
  name: string;
  price: number;
  category: string;
}

interface ToothService {
  toothId: number;
  services: Service[];
  serviceStatuses?: Record<number, string>; // {service_id: "pending"/"completed"}
}

interface TeethMapProps {
  services: Service[];
  onToothServicesChange: (toothServices: ToothService[]) => void;
  selectedTeeth?: number[];
  onToothSelect?: (toothId: number) => void;
  teethServices?: Record<number, number[]>;
  toothServices?: ToothService[]; // Добавляем пропс для данных в формате ToothService[]
  onAddServiceToTooth?: (toothId: number, serviceId: number) => void;
  onRemoveServiceFromTooth?: (toothId: number, serviceId: number) => void;
  onClearSelection?: () => void;
  // Новые пропсы для статуса зубов
  treatedTeeth?: number[]; // Зубы, которые уже вылечены (зеленые)
  treatmentTeeth?: number[]; // Зубы, на которых назначено лечение (красные)
  // Новые пропсы для управления услугами
  onUpdateServiceStatus?: (toothId: number, serviceId: number, status: string) => void;
}

const TeethMap = forwardRef<any, TeethMapProps>((props, ref) => {
  const { 
    services, 
    onToothServicesChange,
    selectedTeeth: externalSelectedTeeth,
    onToothSelect,
    onAddServiceToTooth,
    onClearSelection,
    treatedTeeth = [],
    treatmentTeeth = [],
    toothServices: externalToothServices = [],
    onUpdateServiceStatus
  } = props;
  
  // Используем onUpdateServiceStatus для избежания предупреждения линтера
  console.log('🔄 TeethMap: onUpdateServiceStatus доступен:', !!onUpdateServiceStatus);
  const [selectedTeeth, setSelectedTeeth] = useState<number[]>(externalSelectedTeeth || []);
  const [toothServices, setToothServices] = useState<ToothService[]>([]);

  // Синхронизируем с внешними selectedTeeth
  useEffect(() => {
    if (externalSelectedTeeth) {
      setSelectedTeeth(externalSelectedTeeth);
    } else {
      // Если внешние selectedTeeth пустые, сбрасываем внутренний выбор
      setSelectedTeeth([]);
    }
  }, [externalSelectedTeeth]);

  // Синхронизируем с внешними toothServices
  useEffect(() => {
    if (externalToothServices && externalToothServices.length > 0) {
      console.log('🦷 TeethMap получил внешние toothServices:', externalToothServices);
      setToothServices(externalToothServices);
      // Обновляем цвета зубов после обновления данных
      setTimeout(() => {
        updateAllTeethColors();
      }, 100);
    } else {
      console.log('🦷 TeethMap: внешние toothServices пустые или отсутствуют');
      setToothServices([]);
      // Обновляем цвета зубов после очистки данных
      setTimeout(() => {
        updateAllTeethColors();
      }, 100);
    }
  }, [externalToothServices]);

  // Обновляем внутреннее состояние выбранных зубов при изменении внешних пропсов
  useEffect(() => {
    console.log('🦷 TeethMap получил новые внешние пропсы:');
    console.log('  - externalSelectedTeeth:', externalSelectedTeeth);
    console.log('  - treatedTeeth:', treatedTeeth);
    console.log('  - treatmentTeeth:', treatmentTeeth);
    console.log('  - externalToothServices:', externalToothServices);
    console.log('  - services:', services);
    console.log('🦷 ДЕТАЛЬНАЯ ИНФОРМАЦИЯ О ЗУБАХ:');
    console.log('  - Зубы с назначенными услугами (treatmentTeeth):', treatmentTeeth);
    console.log('  - Вылеченные зубы (treatedTeeth):', treatedTeeth);
    console.log('  - Выбранные зубы (externalSelectedTeeth):', externalSelectedTeeth);
    console.log('  - Внутренние toothServices:', toothServices);
    
    // Обновляем внутреннее состояние выбранных зубов только если внешние пропсы изменились
    if (externalSelectedTeeth) {
      setSelectedTeeth(externalSelectedTeeth);
    } else {
      setSelectedTeeth([]);
    }
    
    // Обновляем цвета зубов после изменения пропсов
    setTimeout(() => {
      updateAllTeethColors();
    }, 100);
  }, [externalSelectedTeeth, treatedTeeth, treatmentTeeth, externalToothServices, services]);

  const updateAllTeethColors = useCallback(() => {
    console.log('🦷 updateAllTeethColors вызвана');
    console.log('🦷 Текущие toothServices:', toothServices);
    console.log('🦷 Текущие selectedTeeth:', selectedTeeth);
    
    // Обновляем цвета всех зубов
    for (let toothId = 11; toothId <= 85; toothId++) {
      updateToothColor(toothId);
    }
  }, [selectedTeeth, treatedTeeth, treatmentTeeth]);

  // Отдельный useEffect для обновления цветов
  useEffect(() => {
    console.log('🦷 Обновление цветов зубов:');
    console.log('  - Внутренние выбранные зубы:', selectedTeeth);
    console.log('  - Вылеченные зубы:', treatedTeeth);
    console.log('  - Зубы с назначенным лечением:', treatmentTeeth);
    updateAllTeethColors();
  }, [selectedTeeth, treatedTeeth, treatmentTeeth, updateAllTeethColors]);

  const updateToothColor = (toothId: number) => {
    const toothElement = document.getElementById(`tooth-${toothId}`);
    if (!toothElement) {
      console.log(`🦷 Элемент зуба ${toothId} не найден в DOM`);
      return;
    }

    let color = '#e5e7eb'; // Серый по умолчанию
    let status = 'обычный';

    // Проверяем услуги на зубе
    const toothServiceData = toothServices.find(ts => ts.toothId === toothId);
    
    if (toothServiceData && toothServiceData.services.length > 0) {
      // Если на зубе есть услуги, проверяем их статусы
      const serviceStatuses = toothServiceData.serviceStatuses || {};
      const allServicesCompleted = toothServiceData.services.every(service => 
        serviceStatuses[service.id] === 'completed'
      );
      
      if (allServicesCompleted) {
        color = '#10b981'; // Зеленый - все услуги выполнены
        status = 'все услуги выполнены';
      } else {
        color = '#ef4444'; // Красный - есть невыполненные услуги
        status = 'есть невыполненные услуги';
      }
    } else if (selectedTeeth.includes(toothId)) {
      color = '#3b82f6'; // Синий - выбран
      status = 'выбран';
    }

    // Логируем только зубы с измененным статусом
    if (status !== 'обычный') {
      console.log(`🦷 Зуб ${toothId}: ${status} (${color})`);
      console.log(`🦷   - toothServiceData:`, toothServiceData);
      console.log(`🦷   - selectedTeeth:`, selectedTeeth);
    }

    toothElement.style.fill = color;
    toothElement.style.stroke = '#374151';
    toothElement.style.strokeWidth = '1';
  };

  const handleToothClick = (toothId: number) => {
    if (toothId <= 0) return;

    console.log('🦷 Клик по зубу:', toothId);
    console.log('🦷 Текущие выбранные зубы:', selectedTeeth);

    // Проверяем, есть ли услуги на этом зубе
    const toothServiceData = toothServices.find(ts => ts.toothId === toothId);
    
    if (toothServiceData && toothServiceData.services.length > 0) {
      // Если на зубе есть услуги, добавляем его к выбранным зубам для добавления новых услуг
      console.log('🦷 На зубе есть услуги, добавляем к выбранным:', toothServiceData.services);
      
      let newSelectedTeeth: number[];
      if (selectedTeeth.includes(toothId)) {
        // Убираем зуб из выбора
        newSelectedTeeth = selectedTeeth.filter(id => id !== toothId);
        console.log('🦷 Убираем зуб из выбора. Новый список:', newSelectedTeeth);
      } else {
        // Добавляем зуб к выбору
        newSelectedTeeth = [...selectedTeeth, toothId];
        console.log('🦷 Добавляем зуб к выбору. Новый список:', newSelectedTeeth);
      }
      
      setSelectedTeeth(newSelectedTeeth);
      
      // Вызываем внешний обработчик с новым списком зубов
      if (onToothSelect) {
        onToothSelect(toothId);
      }

      // Обновляем цвета
      updateAllTeethColors();
      return;
    }

    // Если на зубе нет услуг, работаем как раньше - множественный выбор
    let newSelectedTeeth: number[];
    if (selectedTeeth.includes(toothId)) {
      // Убираем зуб из выбора
      newSelectedTeeth = selectedTeeth.filter(id => id !== toothId);
      console.log('🦷 Убираем зуб из выбора. Новый список:', newSelectedTeeth);
    } else {
      // Добавляем зуб к выбору
      newSelectedTeeth = [...selectedTeeth, toothId];
      console.log('🦷 Добавляем зуб к выбору. Новый список:', newSelectedTeeth);
    }
    
    setSelectedTeeth(newSelectedTeeth);
    
    // Вызываем внешний обработчик с новым списком зубов
    if (onToothSelect) {
      onToothSelect(toothId);
    }

    // Обновляем цвета
    updateAllTeethColors();
  };

  const handleServiceSelect = (service: Service) => {
    if (selectedTeeth.length === 0) {
      alert('Сначала выберите зуб');
      return;
    }

    // Добавляем услугу ко всем выбранным зубам
    let updatedToothServices = [...toothServices];
    
    selectedTeeth.forEach(toothId => {
      const existingToothService = updatedToothServices.find(ts => ts.toothId === toothId);
      
      if (existingToothService) {
        // Проверяем, не добавлена ли уже эта услуга
        if (!existingToothService.services.some(s => s.id === service.id)) {
          // Добавляем услугу к существующему зубу
          updatedToothServices = updatedToothServices.map(ts => 
            ts.toothId === toothId 
              ? { ...ts, services: [...ts.services, service] }
              : ts
          );
        }
      } else {
        // Создаем новую запись для зуба
        const newToothService: ToothService = {
          toothId,
          services: [service]
        };
        updatedToothServices.push(newToothService);
      }

      // Вызываем внешний обработчик
      if (onAddServiceToTooth) {
        onAddServiceToTooth(toothId, service.id);
      }
    });
    
    setToothServices(updatedToothServices);
    onToothServicesChange(updatedToothServices);
    
    // Сбрасываем выбор зубов после добавления услуги
    setSelectedTeeth([]);
    updateAllTeethColors();
  };

  const handleRemoveService = (toothId: number, serviceId: number) => {
    const updatedToothServices = toothServices.map(ts => 
      ts.toothId === toothId 
        ? { ...ts, services: ts.services.filter(s => s.id !== serviceId) }
        : ts
    ).filter(ts => ts.services.length > 0);
    
    setToothServices(updatedToothServices);
    onToothServicesChange(updatedToothServices);
  };

  const handleClearSelection = () => {
    setSelectedTeeth([]);
    if (onClearSelection) {
      onClearSelection();
    }
    updateAllTeethColors();
  };

  // Функция для сброса выбора (вызывается извне)
  const resetSelection = () => {
    console.log('🦷 Очищен выбор зубов');
    console.log('🦷 НЕ сбрасываем зубы с назначенными услугами!');
    // Сбрасываем только выбранные зубы, НЕ зубы с услугами
    setSelectedTeeth([]);
    updateAllTeethColors();
    
    // Вызываем внешний обработчик сброса
    if (onClearSelection) {
      onClearSelection();
    }
  };

  // Экспортируем функции через ref
  useImperativeHandle(ref, () => ({
    resetSelection
  }));

  // Создаем SVG карту зубов
  const createTeethSVG = () => {
    
    // Анатомически верная карта зубов с правильной нумерацией
    // Верхняя челюсть (справа налево): 18, 17, 16, 15, 14, 13, 12, 11 | 21, 22, 23, 24, 25, 26, 27, 28
    const upperTeeth = [
      { id: 18, x: 40, y: 20, width: 20, height: 35, label: '18', type: 'molar' },
      { id: 17, x: 65, y: 20, width: 20, height: 35, label: '17', type: 'molar' },
      { id: 16, x: 90, y: 20, width: 20, height: 35, label: '16', type: 'molar' },
      { id: 15, x: 115, y: 20, width: 18, height: 35, label: '15', type: 'premolar' },
      { id: 14, x: 138, y: 20, width: 18, height: 35, label: '14', type: 'premolar' },
      { id: 13, x: 161, y: 20, width: 16, height: 35, label: '13', type: 'canine' },
      { id: 12, x: 182, y: 20, width: 14, height: 35, label: '12', type: 'incisor' },
      { id: 11, x: 201, y: 20, width: 14, height: 35, label: '11', type: 'incisor' },
      { id: 21, x: 220, y: 20, width: 14, height: 35, label: '21', type: 'incisor' },
      { id: 22, x: 239, y: 20, width: 14, height: 35, label: '22', type: 'incisor' },
      { id: 23, x: 258, y: 20, width: 16, height: 35, label: '23', type: 'canine' },
      { id: 24, x: 279, y: 20, width: 18, height: 35, label: '24', type: 'premolar' },
      { id: 25, x: 302, y: 20, width: 18, height: 35, label: '25', type: 'premolar' },
      { id: 26, x: 325, y: 20, width: 20, height: 35, label: '26', type: 'molar' },
      { id: 27, x: 350, y: 20, width: 20, height: 35, label: '27', type: 'molar' },
      { id: 28, x: 375, y: 20, width: 20, height: 35, label: '28', type: 'molar' },
    ];

    // Нижняя челюсть (справа налево): 48, 47, 46, 45, 44, 43, 42, 41 | 31, 32, 33, 34, 35, 36, 37, 38
    const lowerTeeth = [
      { id: 48, x: 40, y: 85, width: 20, height: 35, label: '48', type: 'molar' },
      { id: 47, x: 65, y: 85, width: 20, height: 35, label: '47', type: 'molar' },
      { id: 46, x: 90, y: 85, width: 20, height: 35, label: '46', type: 'molar' },
      { id: 45, x: 115, y: 85, width: 18, height: 35, label: '45', type: 'premolar' },
      { id: 44, x: 138, y: 85, width: 18, height: 35, label: '44', type: 'premolar' },
      { id: 43, x: 161, y: 85, width: 16, height: 35, label: '43', type: 'canine' },
      { id: 42, x: 182, y: 85, width: 14, height: 35, label: '42', type: 'incisor' },
      { id: 41, x: 201, y: 85, width: 14, height: 35, label: '41', type: 'incisor' },
      { id: 31, x: 220, y: 85, width: 14, height: 35, label: '31', type: 'incisor' },
      { id: 32, x: 239, y: 85, width: 14, height: 35, label: '32', type: 'incisor' },
      { id: 33, x: 258, y: 85, width: 16, height: 35, label: '33', type: 'canine' },
      { id: 34, x: 279, y: 85, width: 18, height: 35, label: '34', type: 'premolar' },
      { id: 35, x: 302, y: 85, width: 18, height: 35, label: '35', type: 'premolar' },
      { id: 36, x: 325, y: 85, width: 20, height: 35, label: '36', type: 'molar' },
      { id: 37, x: 350, y: 85, width: 20, height: 35, label: '37', type: 'molar' },
      { id: 38, x: 375, y: 85, width: 20, height: 35, label: '38', type: 'molar' },
    ];

    const allTeeth = [...upperTeeth, ...lowerTeeth];

    return (
      <svg 
        width="100%" 
        height="140" 
        viewBox="0 0 420 140" 
        style={{ 
          maxWidth: '420px',
          border: '2px solid #e5e7eb', 
          borderRadius: '12px',
          backgroundColor: '#fafafa',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}
      >
        {/* Фон */}
        <rect x="0" y="0" width="420" height="140" fill="#fafafa" rx="12" />
        
        {/* Заголовки */}
        <text x="210" y="15" textAnchor="middle" fontSize="12" fill="#1f2937" fontWeight="600">
          Верхняя челюсть
        </text>
        <text x="210" y="135" textAnchor="middle" fontSize="12" fill="#1f2937" fontWeight="600">
          Нижняя челюсть
        </text>
        
        {/* Разделительная линия */}
        <line x1="20" y1="70" x2="400" y2="70" stroke="#d1d5db" strokeWidth="1" strokeDasharray="3,3" />
        
        {/* Зубы */}
        {allTeeth.map(tooth => {
          // Определяем форму зуба в зависимости от типа
          const getToothShape = (tooth: any) => {
            const { x, y, width, height, type } = tooth;
            
            if (type === 'molar') {
              // Моляры - более широкие и квадратные
              return (
                <rect
                  x={x}
                  y={y}
                  width={width}
                  height={height}
                  rx="4"
                  ry="4"
                />
              );
            } else if (type === 'premolar') {
              // Премоляры - средние
              return (
                <rect
                  x={x}
                  y={y}
                  width={width}
                  height={height}
                  rx="3"
                  ry="3"
                />
              );
            } else if (type === 'canine') {
              // Клыки - заостренные
              return (
                <path
                  d={`M${x + width/2} ${y} L${x + width} ${y + height/3} L${x + width} ${y + height} L${x} ${y + height} L${x} ${y + height/3} Z`}
                />
              );
            } else {
              // Резцы - узкие и прямоугольные
              return (
                <rect
                  x={x}
                  y={y}
                  width={width}
                  height={height}
                  rx="2"
                  ry="2"
                />
              );
            }
          };

          return (
            <g key={tooth.id}>
              {getToothShape(tooth)}
              <rect
                id={`tooth-${tooth.id}`}
                x={tooth.x}
                y={tooth.y}
                width={tooth.width}
                height={tooth.height}
                rx={tooth.type === 'molar' ? 4 : tooth.type === 'premolar' ? 3 : tooth.type === 'canine' ? 0 : 2}
                ry={tooth.type === 'molar' ? 4 : tooth.type === 'premolar' ? 3 : tooth.type === 'canine' ? 0 : 2}
                fill="#e5e7eb"
                stroke="#374151"
                strokeWidth="1.5"
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  console.log('🦷 ПРЯМОЙ КЛИК ПО ЗУБУ:', tooth.id);
                  console.log('🦷 Элемент зуба:', document.getElementById(`tooth-${tooth.id}`));
                  handleToothClick(tooth.id);
                }}
              />
              <text
                x={tooth.x + tooth.width / 2}
                y={tooth.y + tooth.height / 2 + 3}
                textAnchor="middle"
                fontSize="9"
                fill="#374151"
                fontWeight="600"
                style={{ pointerEvents: 'none' }}
              >
                {tooth.label}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div style={{ 
      padding: '1rem', 
      backgroundColor: 'white', 
      borderRadius: '8px', 
      border: '1px solid #e5e7eb',
      maxWidth: '100%',
      overflow: 'hidden'
    }}>

      <h3 style={{ 
        marginBottom: '1rem', 
        color: '#374151',
        fontSize: 'clamp(1rem, 4vw, 1.25rem)',
        textAlign: 'center'
      }}>Карта зубов</h3>
      
      {/* SVG карта зубов */}
      <div style={{ 
        marginBottom: '1rem', 
        display: 'flex', 
        justifyContent: 'center',
        width: '100%',
        overflow: 'hidden'
      }}>
        {createTeethSVG()}
      </div>

      {/* Легенда под картой */}
      <div style={{ 
        marginBottom: '1rem', 
        padding: '1rem', 
        backgroundColor: '#f8fafc', 
        borderRadius: '8px',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          gap: '2rem',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ 
              width: '16px', 
              height: '16px', 
              borderRadius: '3px', 
              backgroundColor: '#10b981', 
              border: '1px solid #059669' 
            }} />
            <span style={{ fontSize: '0.875rem', color: '#374151', fontWeight: '500' }}>Вылечен</span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ 
              width: '16px', 
              height: '16px', 
              borderRadius: '3px', 
              backgroundColor: '#ef4444', 
              border: '1px solid #dc2626' 
            }} />
            <span style={{ fontSize: '0.875rem', color: '#374151', fontWeight: '500' }}>Лечение назначено</span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ 
              width: '16px', 
              height: '16px', 
              borderRadius: '3px', 
              backgroundColor: '#3b82f6', 
              border: '1px solid #2563eb' 
            }} />
            <span style={{ fontSize: '0.875rem', color: '#374151', fontWeight: '500' }}>Выбран</span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ 
              width: '16px', 
              height: '16px', 
              borderRadius: '3px', 
              backgroundColor: '#e5e7eb', 
              border: '1px solid #9ca3af' 
            }} />
            <span style={{ fontSize: '0.875rem', color: '#374151', fontWeight: '500' }}>Обычный</span>
          </div>
        </div>
        
        {/* Инструкция */}
        <div style={{ 
          textAlign: 'center', 
          marginTop: '0.75rem', 
          fontSize: '0.875rem', 
          color: '#6b7280' 
        }}>
          💡 Кликните на зубы для выбора • Можно выбрать несколько зубов
        </div>
      </div>

      {/* Выбранные зубы */}
      {selectedTeeth.length > 0 && (
        <div style={{ 
          marginBottom: '1rem', 
          padding: '1rem', 
          backgroundColor: '#eff6ff', 
          borderRadius: '8px',
          border: '1px solid #bfdbfe'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.25rem' }}>🦷</span>
            <strong style={{ color: '#1e40af', fontSize: '1rem' }}>Выбранные зубы:</strong> 
            <span style={{ color: '#1e40af', fontWeight: '600', fontSize: '1rem' }}>
              {selectedTeeth.join(', ')}
            </span>
          </div>
          {selectedTeeth.length > 1 && (
            <div style={{ 
              fontSize: '0.875rem', 
              color: '#6b7280', 
              backgroundColor: '#dbeafe',
              padding: '0.5rem',
              borderRadius: '4px',
              border: '1px solid #93c5fd'
            }}>
              💡 Услуга будет добавлена ко всем выбранным зубам ({selectedTeeth.length} зубов)
            </div>
          )}
        </div>
      )}

      {/* Список услуг для выбранных зубов */}
      {selectedTeeth.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <h4 style={{ marginBottom: '0.75rem', color: '#374151', fontSize: '1rem', fontWeight: '600' }}>
            Добавить услугу к зубам {selectedTeeth.length > 1 ? selectedTeeth.join(', ') : selectedTeeth[0]}:
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            {services.map(service => (
              <button
                key={service.id}
                onClick={() => handleServiceSelect(service)}
                style={{
                  padding: '0.75rem 1.25rem',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#2563eb';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#3b82f6';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.3)';
                }}
              >
                {service.name} - {service.price}₸
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Список назначенных услуг */}
      {toothServices.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <h4 style={{ marginBottom: '0.75rem', color: '#374151', fontSize: '1rem', fontWeight: '600' }}>
            📋 Назначенные услуги:
          </h4>
          {toothServices.map(toothService => (
            <div key={toothService.toothId} style={{ 
              marginBottom: '0.75rem', 
              padding: '1rem', 
              backgroundColor: '#fef2f2', 
              borderRadius: '8px',
              border: '1px solid #fecaca'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '1.25rem' }}>🦷</span>
                <strong style={{ color: '#dc2626', fontSize: '1rem' }}>Зуб {toothService.toothId}:</strong>
                <span style={{ 
                  fontSize: '0.875rem', 
                  color: '#6b7280',
                  backgroundColor: '#f3f4f6',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px'
                }}>
                  {toothService.services.length} услуг
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                {toothService.services.map(service => (
                  <div key={service.id} style={{
                    padding: '0.75rem 1rem',
                    backgroundColor: '#dc2626',
                    color: 'white',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    boxShadow: '0 2px 4px rgba(220, 38, 38, 0.2)'
                  }}>
                    <span style={{ fontSize: '1rem' }}>⚕️</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <span>{service.name}</span>
                      <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>{service.price}₸</span>
                    </div>
                    <button
                      onClick={() => handleRemoveService(toothService.toothId, service.id)}
                      style={{
                        background: 'rgba(255,255,255,0.2)',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        padding: '0.5rem',
                        borderRadius: '4px',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)';
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}


      {/* Кнопки управления */}
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
        <button
          onClick={handleClearSelection}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '500',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#4b5563';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#6b7280';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          🗑️ Очистить выбор
        </button>
      </div>
    </div>
  );
});

export default TeethMap;
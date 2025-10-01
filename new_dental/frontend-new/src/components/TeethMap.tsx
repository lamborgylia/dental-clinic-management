import React, { useState, useEffect, useRef } from 'react';

interface Service {
  id: number;
  name: string;
  price: number;
  category: string;
}

interface ToothService {
  toothId: number;
  services: Service[];
}

interface TeethMapProps {
  services: Service[];
  onToothServicesChange: (toothServices: ToothService[]) => void;
  selectedTeeth?: number[];
  onToothSelect?: (toothId: number) => void;
  teethServices?: Record<number, number[]>;
  onAddServiceToTooth?: (toothId: number, serviceId: number) => void;
  onRemoveServiceFromTooth?: (toothId: number, serviceId: number) => void;
  onClearSelection?: () => void;
}

const TeethMap: React.FC<TeethMapProps> = ({ 
  services, 
  onToothServicesChange,
  selectedTeeth: externalSelectedTeeth,
  onToothSelect,
  teethServices,
  onAddServiceToTooth
}) => {
  const [selectedTeeth, setSelectedTeeth] = useState<number[]>(externalSelectedTeeth || []);
  
  // Синхронизируем с внешними selectedTeeth
  useEffect(() => {
    if (externalSelectedTeeth) {
      setSelectedTeeth(externalSelectedTeeth);
    }
  }, [externalSelectedTeeth]);

  // Обновляем цвета зубов при изменении selectedTeeth
  useEffect(() => {
    updateAllTeethColors();
  }, [selectedTeeth]);
  const [toothServices, setToothServices] = useState<ToothService[]>([]);
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [svgContent, setSvgContent] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Загружаем SVG карту зубов
  useEffect(() => {
    fetch('/src/components/Map.svg')
      .then(response => response.text())
      .then(svgText => {
        console.log('📁 SVG карта зубов загружена');
        setSvgContent(svgText);
      })
      .catch(error => {
        console.error('❌ Ошибка загрузки SVG карты зубов:', error);
      });
  }, []);

  // Обрабатываем SVG после загрузки
  useEffect(() => {
    if (containerRef.current && svgContent) {
      console.log('🔄 Обрабатываем SVG карту зубов');
      
      // Ждем немного для полной загрузки DOM
      setTimeout(() => {
        processTeeth();
      }, 100);
    }
  }, [svgContent]);

  // Обрабатываем зубы в SVG
  const processTeeth = () => {
    if (!containerRef.current) return;
    
    console.log('🔧 Обрабатываем зубы в SVG карте');
    
    // Ищем все пути с классом tooth-X
    const toothPaths = containerRef.current.querySelectorAll('path[class*="tooth-"]');
    console.log('🔍 Найдено зубов в SVG:', toothPaths.length);
    
    if (toothPaths.length === 0) {
      console.log('⚠️ Зубы не найдены в SVG');
      return;
    }
    
    // Обрабатываем каждый найденный зуб
    toothPaths.forEach((path) => {
      const className = path.getAttribute('class') || '';
      console.log(`🔍 Обрабатываем путь с классом: "${className}"`);
      
      // Извлекаем номер зуба из класса (например, tooth-11 -> 11)
      const toothMatch = className.match(/tooth-(\d+)/);
      if (!toothMatch) return;
      
      const toothId = parseInt(toothMatch[1]);
      if (!Number.isFinite(toothId) || toothId <= 0) {
        console.log('⛔️ Пропускаем некорректный toothId:', toothId);
        return;
      }
      console.log(`🦷 Обрабатываем зуб ${toothId}`);
      
      // Устанавливаем цвет для зуба
      updateToothColor(path, toothId);
      
      // Убираем старые обработчики событий
      const newPath = path.cloneNode(true) as SVGPathElement;
      path.parentNode?.replaceChild(newPath, path);
      
      // Устанавливаем цвет для нового элемента
      updateToothColor(newPath, toothId);
      
      // Добавляем обработчики событий
      newPath.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('🦷 Клик по зубу:', toothId);
        handleToothClick(toothId);
      });
      
      newPath.addEventListener('mouseenter', () => {
        // При наведении показываем синий цвет для невыбранных зубов
        if (!selectedTeeth.includes(toothId)) {
          newPath.setAttribute('fill', '#3b82f6'); // Синий при наведении
        }
      });
      
      newPath.addEventListener('mouseleave', () => {
        // Возвращаем правильный цвет
        updateToothColor(newPath, toothId);
      });
      
      // Добавляем стили для лучшей кликабельности
      newPath.style.cursor = 'pointer';
      newPath.style.pointerEvents = 'all';
    });
    
    console.log('✅ Зубы в SVG карте обработаны');
  };

  // Обновляем цвет конкретного зуба
  const updateToothColor = (path: Element, toothId: number) => {
    const toothService = toothServices.find(ts => ts.toothId === toothId);
    
    let color = '#e5e7eb'; // По умолчанию серый
    
    // Если у зуба есть услуги - красный
    if (toothService && toothService.services.length > 0) {
      color = '#ef4444';
      console.log(`🦷 Зуб ${toothId}: красный (есть услуги)`);
    }
    // Если зуб выбран - синий
    else if (selectedTeeth.includes(toothId)) {
      color = '#3b82f6';
      console.log(`🦷 Зуб ${toothId}: синий (выбран)`);
    }
    else {
      console.log(`🦷 Зуб ${toothId}: серый (по умолчанию)`);
    }
    
    console.log(`🎨 Обновляем цвет зуба ${toothId}: ${color}`);
    path.setAttribute('fill', color);
    
    // Проверяем, что цвет действительно установился
    const actualColor = path.getAttribute('fill');
    if (actualColor !== color) {
      console.warn(`⚠️ Цвет зуба ${toothId} не установился: ожидался ${color}, получился ${actualColor}`);
      // Принудительно устанавливаем цвет
      path.setAttribute('fill', color);
    }
  };

  // Обработчик клика по зубу
  const handleToothClick = (toothId: number) => {
    console.log('🦷 Клик по зубу:', toothId);
    
    // Всегда обновляем внутреннее состояние
    setSelectedTeeth(prev => {
      const newSelection = prev.includes(toothId) 
        ? prev.filter(id => id !== toothId)
        : [...prev, toothId];
      
      console.log('🦷 Новый выбор зубов:', newSelection);
      return newSelection;
    });
    
    // Загружаем уже выбранные услуги для этого зуба (если есть)
    const existingToothService = toothServices.find(ts => ts.toothId === toothId);
    if (existingToothService) {
      setSelectedServices(existingToothService.services);
    } else {
      setSelectedServices([]);
    }
    
    // Вызываем внешний обработчик если есть
    if (onToothSelect) {
      onToothSelect(toothId);
    }
  };

  // Добавление услуги к выбранным зубам
  const handleAddService = (service: Service) => {
    if (selectedTeeth.length === 0) return;
    
    setSelectedServices(prev => {
      const isAlreadySelected = prev.find(s => s.id === service.id);
      if (isAlreadySelected) {
        return prev.filter(s => s.id !== service.id);
      } else {
        return [...prev, service];
      }
    });
  };

  // Сохранение услуг для выбранных зубов
  const handleSaveToothServices = () => {
    if (selectedTeeth.length === 0 || selectedServices.length === 0) return;
    
    console.log('💾 Сохраняем услуги для зубов:', selectedTeeth, selectedServices);
    
    // Если есть внешний обработчик, используем его
    if (onAddServiceToTooth) {
      selectedTeeth.forEach(toothId => {
        selectedServices.forEach(service => {
          console.log('🦷 Вызываем onAddServiceToTooth:', toothId, service.id);
          onAddServiceToTooth(toothId, service.id);
        });
      });
    } else {
      // Старая логика для обратной совместимости
      let newToothServices = [...toothServices];
      
      // Убираем старые услуги для выбранных зубов
      newToothServices = newToothServices.filter(ts => !selectedTeeth.includes(ts.toothId));
      
      // Добавляем новые услуги для каждого выбранного зуба
      selectedTeeth.forEach(toothId => {
        newToothServices.push({
          toothId: toothId,
          services: selectedServices
        });
      });
      
      setToothServices(newToothServices);
      onToothServicesChange(newToothServices);
    }
    
    // Автоматически очищаем выбор зубов и услуг для следующего выбора
    setSelectedTeeth([]);
    setSelectedServices([]);
    
    // Обновляем цвета всех зубов
    updateAllTeethColors();
    
    console.log('✅ Услуги сохранены для зубов:', selectedTeeth);
    console.log('🦷 Выбор очищен - можно выбирать следующий зуб');
  };

  // Удаление услуг для зуба

  // Обновляем цвета всех зубов
  const updateAllTeethColors = () => {
    if (!containerRef.current) return;
    
    console.log('🎨 Обновляем цвета всех зубов');
    
    const toothPaths = containerRef.current.querySelectorAll('path[class*="tooth-"]');
    toothPaths.forEach((path) => {
      const className = path.getAttribute('class') || '';
      const toothMatch = className.match(/tooth-(\d+)/);
      if (toothMatch) {
        const toothId = parseInt(toothMatch[1]);
        updateToothColor(path, toothId);
      }
    });
    
    console.log('✅ Цвета всех зубов обновлены');
  };

  // Переустанавливаем обработчики событий для зубов
  const reattachEventListeners = () => {
    if (!containerRef.current) return;
    
    console.log('🔧 Переустанавливаем обработчики событий для зубов');
    
    const toothPaths = containerRef.current.querySelectorAll('path[class*="tooth-"]');
    toothPaths.forEach((path) => {
      const className = path.getAttribute('class') || '';
      const toothMatch = className.match(/tooth-(\d+)/);
      if (!toothMatch) return;
      
      const toothId = parseInt(toothMatch[1]);
      
      // Убираем старые обработчики
      const newPath = path.cloneNode(true) as SVGPathElement;
      path.parentNode?.replaceChild(newPath, path);
      
      // Устанавливаем цвет для нового элемента
      updateToothColor(newPath, toothId);
      
      // Добавляем обработчики событий
      newPath.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('🦷 Клик по зубу:', toothId);
        handleToothClick(toothId);
      });
      
      newPath.addEventListener('mouseenter', () => {
        // При наведении показываем синий цвет для невыбранных зубов
        if (!selectedTeeth.includes(toothId)) {
          newPath.setAttribute('fill', '#3b82f6'); // Синий при наведении
        }
      });
      
      newPath.addEventListener('mouseleave', () => {
        // Возвращаем правильный цвет
        updateToothColor(newPath, toothId);
      });
      
      // Добавляем стили для лучшей кликабельности
      newPath.style.cursor = 'pointer';
      newPath.style.pointerEvents = 'all';
    });
    
    console.log('✅ Обработчики событий переустановлены');
  };

  // Обновляем цвета зубов при изменении состояния
  useEffect(() => {
    if (containerRef.current && svgContent) {
      console.log('🔄 useEffect: обновляем цвета зубов');
      console.log('🦷 selectedTeeth:', selectedTeeth);
      console.log('🦷 toothServices:', toothServices);
      
      // Небольшая задержка для гарантии обновления DOM
      setTimeout(() => {
        updateAllTeethColors();
        // Переустанавливаем обработчики событий для зубов
        reattachEventListeners();
      }, 50);
    }
  }, [toothServices, selectedTeeth, svgContent]);

  return (
    <div className="teeth-map-container">
      {/* Карта зубов */}
      <div className="teeth-map">
        {/* SVG карта зубов */}
        <div 
          ref={containerRef}
          className="svg-container"
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      </div>

      {/* Выбор услуг для выбранных зубов */}
      <div className="services-selection">
        <h4 className="services-title">
          {selectedTeeth.length > 0 
            ? `Выбор услуг для зубов: ${selectedTeeth.join(', ')}`
            : 'Выберите зуб для назначения услуг'
          }
        </h4>
          
          <div className="services-grid">
            {services && services.map(service => (
              <div
                key={service.id}
                className={`service-item ${
                  selectedServices.find(s => s.id === service.id) ? 'selected' : ''
                }`}
                onClick={() => handleAddService(service)}
              >
                <div className="service-name">{service.name}</div>
                <div className="service-price">{service.price} ₸</div>
                <div className="service-category">{service.category || 'Общее'}</div>
              </div>
            ))}
          </div>
          
          <div className="services-actions">
            <button
              className="btn-save"
              onClick={handleSaveToothServices}
              disabled={selectedTeeth.length === 0 || selectedServices.length === 0}
            >
              {selectedTeeth.length > 0 
                ? `Добавить услуги для зубов ${selectedTeeth.join(', ')}`
                : 'Выберите зуб для назначения услуг'
              }
            </button>
            
            <button
              className="btn-cancel"
              onClick={() => {
                setSelectedTeeth([]);
                setSelectedServices([]);
              }}
            >
              Отмена
            </button>
            
            <button
              className="btn-clear"
              onClick={() => {
                setSelectedTeeth([]);
                setSelectedServices([]);
              }}
              style={{
                backgroundColor: '#6b7280',
                color: 'white',
                padding: '10px 20px',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Очистить выбор зубов
            </button>
          </div>
        </div>

        <style>{`
        .teeth-map-container {
          width: 100%;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          background: transparent;
        }

        .teeth-map {
          margin-bottom: 30px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .svg-container {
          width: 100%;
          max-width: 600px;
          height: auto;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .svg-container svg {
          width: 100%;
          height: auto;
          max-height: 400px;
        }

        .services-selection {
          background: #f9fafb;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
          border: 2px solid #e5e7eb;
          min-height: 200px;
        }

        .services-title {
          color: #1f2937;
          margin-bottom: 15px;
          font-size: 1.125rem;
          font-weight: 600;
        }

        .services-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 12px;
          margin-bottom: 20px;
        }

        .service-item {
          background: white;
          padding: 12px;
          border-radius: 6px;
          border: 2px solid #e5e7eb;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .service-item:hover {
          border-color: #3b82f6;
          transform: translateY(-2px);
        }

        .service-item.selected {
          border-color: #ef4444;
          background: #fef2f2;
        }

        .service-name {
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 4px;
        }

        .service-price {
          color: #059669;
          font-weight: 500;
          margin-bottom: 2px;
        }

        .service-category {
          color: #6b7280;
          font-size: 0.875rem;
        }

        .services-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
        }

        .btn-save, .btn-cancel {
          padding: 10px 20px;
          border-radius: 6px;
          border: none;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-save {
          background: #ef4444;
          color: white;
        }

        .btn-save:hover:not(:disabled) {
          background: #dc2626;
          transform: translateY(-1px);
        }

        .btn-save:disabled {
          background: #9ca3af;
          cursor: not-allowed;
          opacity: 0.6;
        }

        .btn-cancel {
          background: #6b7280;
          color: white;
        }

        .btn-cancel:hover {
          background: #4b5563;
          transform: translateY(-1px);
        }

        @media (max-width: 768px) {
          .teeth-map-container {
            padding: 15px;
          }
          
          .svg-container {
            max-width: 100%;
          }
          
          .services-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default TeethMap;
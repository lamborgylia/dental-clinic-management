import React, { useState, useEffect } from 'react';
import api from '../services/api';

interface Service {
  id: number;
  name: string;
  description?: string;
  price: number;
  category?: string;
}

interface HomePageProps {
  clinicName?: string;
  clinicDescription?: string;
  clinicAddress?: string;
  clinicContacts?: string;
}

const HomePage: React.FC<HomePageProps> = ({ 
  clinicName = "DentalCare",
  clinicDescription = "Современная стоматологическая клиника с высококвалифицированными специалистами",
  clinicAddress = "ул. Примерная, 123, г. Алматы",
  clinicContacts = "+7 (777) 123-45-67, info@smile.kz"
}) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await api.get('/services/');
        setServices(response.data);
      } catch (error) {
        console.error('Ошибка загрузки услуг:', error);
        // Используем дефолтные услуги если API недоступен
        setServices([
          { id: 1, name: 'Консультация стоматолога', price: 5000, category: 'Консультации' },
          { id: 2, name: 'Лечение кариеса', price: 15000, category: 'Терапия' },
          { id: 3, name: 'Удаление зуба', price: 8000, category: 'Хирургия' },
          { id: 4, name: 'Протезирование', price: 50000, category: 'Протезирование' },
          { id: 5, name: 'Имплантация', price: 80000, category: 'Имплантация' },
          { id: 6, name: 'Отбеливание зубов', price: 25000, category: 'Эстетика' }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);
  return (
    <div style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      minHeight: 'calc(100vh - 80px)'
    }}>
      {/* Hero Section */}
      <section style={{
        padding: '4rem 2rem',
        textAlign: 'center',
        color: 'white'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            fontWeight: 'bold',
            marginBottom: '1rem',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
          }}>
            Добро пожаловать в {clinicName}
          </h1>
          <p style={{
            fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)',
            marginBottom: '2rem',
            opacity: 0.9,
            maxWidth: '800px',
            margin: '0 auto 2rem'
          }}>
            {clinicDescription}
          </p>
          <div style={{
            display: 'flex',
            gap: '2rem',
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginTop: '3rem'
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              padding: '2rem',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              minWidth: '250px'
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                background: 'white',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem'
              }}>
                <svg width="30" height="30" fill="#667eea" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem' }}>Качественное лечение</h3>
              <p style={{ margin: 0, opacity: 0.9 }}>Современное оборудование и опытные врачи</p>
            </div>
            
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              padding: '2rem',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              minWidth: '250px'
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                background: 'white',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem'
              }}>
                <svg width="30" height="30" fill="#667eea" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem' }}>Индивидуальный подход</h3>
              <p style={{ margin: 0, opacity: 0.9 }}>Персональный план лечения для каждого пациента</p>
            </div>
            
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              padding: '2rem',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              minWidth: '250px'
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                background: 'white',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem'
              }}>
                <svg width="30" height="30" fill="#667eea" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                </svg>
              </div>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem' }}>Удобное время</h3>
              <p style={{ margin: 0, opacity: 0.9 }}>Гибкий график работы и онлайн запись</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section style={{
        padding: '4rem 2rem',
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: 'bold',
            marginBottom: '2rem',
            color: 'white'
          }}>
            О нашей клинике
          </h2>
          <p style={{
            fontSize: '1.2rem',
            color: 'white',
            opacity: 0.9,
            maxWidth: '800px',
            margin: '0 auto 3rem',
            lineHeight: '1.6'
          }}>
            {clinicDescription}
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem',
            marginTop: '3rem'
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '2rem',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              textAlign: 'left'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '1rem'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: 'white',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '1rem'
                }}>
                  <svg width="20" height="20" fill="#667eea" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                </div>
                <h3 style={{ color: 'white', margin: 0 }}>Наш адрес</h3>
              </div>
              <p style={{ color: 'white', opacity: 0.9, margin: 0, fontSize: '1.1rem' }}>{clinicAddress}</p>
            </div>
            
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '2rem',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              textAlign: 'left'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '1rem'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: 'white',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '1rem'
                }}>
                  <svg width="20" height="20" fill="#667eea" viewBox="0 0 24 24">
                    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                  </svg>
                </div>
                <h3 style={{ color: 'white', margin: 0 }}>Контакты</h3>
              </div>
              <div style={{ color: 'white', opacity: 0.9, fontSize: '1.1rem' }}>
                {clinicContacts.split(',').map((contact, index) => (
                  <p key={index} style={{ margin: '0.5rem 0' }}>{contact.trim()}</p>
                ))}
              </div>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '2rem',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              textAlign: 'left'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '1rem'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: 'white',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '1rem'
                }}>
                  <svg width="20" height="20" fill="#667eea" viewBox="0 0 24 24">
                    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
                    <path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                  </svg>
                </div>
                <h3 style={{ color: 'white', margin: 0 }}>Режим работы</h3>
              </div>
              <div style={{ color: 'white', opacity: 0.9, fontSize: '1.1rem' }}>
                <p style={{ margin: '0.5rem 0' }}>Пн-Пт: 9:00 - 19:00</p>
                <p style={{ margin: '0.5rem 0' }}>Сб: 9:00 - 17:00</p>
                <p style={{ margin: '0.5rem 0' }}>Вс: 10:00 - 15:00</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section style={{
        padding: '4rem 2rem',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: 'bold',
            marginBottom: '2rem',
            color: 'white'
          }}>
            Наши услуги и цены
          </h2>
          {loading ? (
            <div style={{ color: 'white', fontSize: '1.2rem' }}>Загрузка услуг...</div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '2rem',
              marginTop: '3rem'
            }}>
              {services.map((service) => (
                <div key={service.id} style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  padding: '2rem',
                  borderRadius: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  transition: 'transform 0.3s ease',
                  textAlign: 'left'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '1rem'
                  }}>
                    <h3 style={{ 
                      color: 'white', 
                      margin: 0, 
                      fontSize: '1.2rem',
                      flex: 1,
                      marginRight: '1rem'
                    }}>
                      {service.name}
                    </h3>
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.2)',
                      padding: '0.5rem 1rem',
                      borderRadius: '20px',
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      color: 'white',
                      whiteSpace: 'nowrap'
                    }}>
                      {service.price.toLocaleString()} ₸
                    </div>
                  </div>
                  {service.description && (
                    <p style={{ 
                      color: 'white', 
                      opacity: 0.8, 
                      margin: '0 0 1rem 0',
                      fontSize: '0.9rem'
                    }}>
                      {service.description}
                    </p>
                  )}
                  {service.category && (
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      padding: '0.3rem 0.8rem',
                      borderRadius: '12px',
                      fontSize: '0.8rem',
                      color: 'white',
                      opacity: 0.7,
                      display: 'inline-block'
                    }}>
                      {service.category}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
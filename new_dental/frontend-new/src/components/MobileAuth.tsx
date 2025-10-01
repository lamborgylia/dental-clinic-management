import React, { useState } from 'react';
import { authService } from '../services/auth';

interface MobileAuthProps {
  onSuccess: () => void;
}

const MobileAuth: React.FC<MobileAuthProps> = ({ onSuccess }) => {
  const [credentials, setCredentials] = useState({
    phone: '+77771234567',
    password: '1234'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState<any>({});

  const testStorage = () => {
    const info = {
      localStorage: {
        available: typeof Storage !== 'undefined',
        access_token: localStorage.getItem('access_token'),
        user: localStorage.getItem('user'),
        allKeys: Object.keys(localStorage)
      },
      sessionStorage: {
        available: typeof Storage !== 'undefined',
        access_token: sessionStorage.getItem('access_token'),
        user: sessionStorage.getItem('user'),
        allKeys: Object.keys(sessionStorage)
      },
      userAgent: navigator.userAgent,
      isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    };
    setDebugInfo(info);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authService.login(credentials);
      
      // Пробуем сохранить в localStorage
      try {
        localStorage.setItem('access_token', response.access_token);
        localStorage.setItem('user', JSON.stringify(response.user));
        console.log('✅ Сохранено в localStorage');
      } catch (localError) {
        console.error('❌ Ошибка localStorage:', localError);
        
        // Если localStorage не работает, пробуем sessionStorage
        try {
          sessionStorage.setItem('access_token', response.access_token);
          sessionStorage.setItem('user', JSON.stringify(response.user));
          console.log('✅ Сохранено в sessionStorage');
        } catch (sessionError) {
          console.error('❌ Ошибка sessionStorage:', sessionError);
          setError('Не удается сохранить данные авторизации');
          return;
        }
      }
      
      onSuccess();
    } catch (err: any) {
      console.error('Ошибка входа:', err);
      setError(err.response?.data?.detail || err.message || 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
      <h2>🔧 Мобильная авторизация</h2>
      
      <button 
        onClick={testStorage}
        style={{
          padding: '10px',
          backgroundColor: '#f0f0f0',
          border: '1px solid #ccc',
          borderRadius: '5px',
          marginBottom: '20px',
          width: '100%'
        }}
      >
        🔍 Проверить хранилище
      </button>

      {Object.keys(debugInfo).length > 0 && (
        <div style={{ 
          backgroundColor: '#f9f9f9', 
          padding: '10px', 
          borderRadius: '5px',
          marginBottom: '20px',
          fontSize: '12px'
        }}>
          <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
      )}

      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Телефон:</label>
          <input
            type="tel"
            value={credentials.phone}
            onChange={(e) => setCredentials({...credentials, phone: e.target.value})}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ccc',
              borderRadius: '5px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Пароль:</label>
          <input
            type="password"
            value={credentials.password}
            onChange={(e) => setCredentials({...credentials, password: e.target.value})}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ccc',
              borderRadius: '5px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {error && (
          <div style={{
            backgroundColor: '#ffebee',
            color: '#c62828',
            padding: '10px',
            borderRadius: '5px',
            marginBottom: '15px'
          }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#2196f3',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Вход...' : 'Войти'}
        </button>
      </form>

      <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        <p><strong>Быстрые кнопки:</strong></p>
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setCredentials({ phone: '+77771234567', password: '1234' })}
            style={{ padding: '5px 10px', fontSize: '12px', border: '1px solid #ccc', borderRadius: '3px' }}
          >
            Админ
          </button>
          <button
            onClick={() => setCredentials({ phone: '+77771234568', password: '1234' })}
            style={{ padding: '5px 10px', fontSize: '12px', border: '1px solid #ccc', borderRadius: '3px' }}
          >
            Врач
          </button>
          <button
            onClick={() => setCredentials({ phone: '+77771234569', password: '1234' })}
            style={{ padding: '5px 10px', fontSize: '12px', border: '1px solid #ccc', borderRadius: '3px' }}
          >
            Медсестра
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileAuth;


import React, { useState, useEffect } from 'react';
import { authService } from '../services/auth';

const DebugPage: React.FC = () => {
  const [user, setUser] = useState(authService.getUser());
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [testResult, setTestResult] = useState<string>('');

  useEffect(() => {
    // Собираем информацию для отладки
    const info = {
      user: user,
      token: localStorage.getItem('access_token'),
      userData: localStorage.getItem('user'),
      userAgent: navigator.userAgent,
      isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      localStorage: {
        access_token: localStorage.getItem('access_token'),
        user: localStorage.getItem('user'),
        allKeys: Object.keys(localStorage)
      }
    };
    setDebugInfo(info);
  }, [user]);

  const testLogin = async () => {
    try {
      setTestResult('Тестируем логин...');
      const result = await authService.login({ phone: '+77771234567', password: '1234' });
      
      // Сохраняем данные в localStorage
      localStorage.setItem('access_token', result.access_token);
      localStorage.setItem('user', JSON.stringify(result.user));
      
      setTestResult(`Логин успешен: ${JSON.stringify(result)}`);
      
      // Обновляем состояние пользователя
      setUser(result.user);
      
      // Обновляем информацию после логина
      setTimeout(() => {
        const info = {
          user: result.user,
          token: localStorage.getItem('access_token'),
          userData: localStorage.getItem('user'),
          userAgent: navigator.userAgent,
          isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
          localStorage: {
            access_token: localStorage.getItem('access_token'),
            user: localStorage.getItem('user'),
            allKeys: Object.keys(localStorage)
          }
        };
        setDebugInfo(info);
      }, 1000);
    } catch (error) {
      setTestResult(`Ошибка логина: ${error}`);
    }
  };

  const testAPI = async () => {
    try {
      setTestResult('Тестируем API...');
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://192.168.12.93:8001/users/doctors', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTestResult(`API работает! Получено ${data.length} врачей`);
      } else {
        setTestResult(`API ошибка: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      setTestResult(`Ошибка API: ${error}`);
    }
  };

  const clearStorage = () => {
    localStorage.clear();
    setTestResult('LocalStorage очищен');
    window.location.reload();
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🔧 Страница отладки мобильного доступа</h1>
      
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <h3>Информация о браузере:</h3>
        <p><strong>User Agent:</strong> {debugInfo.userAgent}</p>
        <p><strong>Мобильный:</strong> {debugInfo.isMobile ? 'Да' : 'Нет'}</p>
      </div>

      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e8f4fd', borderRadius: '8px' }}>
        <h3>Состояние аутентификации:</h3>
        <p><strong>Пользователь:</strong> {user ? `${user.full_name} (${user.phone})` : 'Не авторизован'}</p>
        <p><strong>Токен:</strong> {debugInfo.token ? 'Есть' : 'Нет'}</p>
        <p><strong>Данные пользователя:</strong> {debugInfo.userData ? 'Есть' : 'Нет'}</p>
      </div>

      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '8px' }}>
        <h3>LocalStorage:</h3>
        <pre style={{ fontSize: '12px', overflow: 'auto' }}>
          {JSON.stringify(debugInfo.localStorage, null, 2)}
        </pre>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Тестирование:</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={testLogin}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            🔐 Тест логина
          </button>
          
          <button 
            onClick={testAPI}
            style={{
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            🌐 Тест API
          </button>
          
          <button 
            onClick={clearStorage}
            style={{
              padding: '10px 20px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            🗑️ Очистить хранилище
          </button>
        </div>
      </div>

      {testResult && (
        <div style={{ 
          padding: '15px', 
          backgroundColor: '#d4edda', 
          borderRadius: '8px',
          border: '1px solid #c3e6cb'
        }}>
          <h4>Результат теста:</h4>
          <p style={{ fontFamily: 'monospace', fontSize: '14px' }}>{testResult}</p>
        </div>
      )}

      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <h3>Инструкции:</h3>
        <ol>
          <li>Откройте эту страницу на телефоне по адресу: <strong>http://192.168.12.93:5173/debug</strong></li>
          <li>Нажмите "Тест логина" и посмотрите результат</li>
          <li>Если логин успешен, нажмите "Тест API"</li>
          <li>Скопируйте всю информацию и отправьте мне</li>
        </ol>
      </div>
    </div>
  );
};

export default DebugPage;

import axios from 'axios';

// Определяем базовый URL в зависимости от окружения
const getBaseURL = () => {
  const { protocol, hostname } = window.location;
  console.log('🔍 Hostname:', hostname);
  
  // Используем тот же хост, что и фронтенд. Это работает и локально, и по сети (мобильные устройства)
  // Примеры: localhost -> http://localhost:8001, 192.168.0.13 -> http://192.168.0.13:8001
  const backendURL = `${protocol}//${hostname}:8001`;
  console.log('🌐 Using same-host backend URL:', backendURL);
  return backendURL;
};

const baseURL = getBaseURL();
console.log('🚀 API Base URL:', baseURL);

const api = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Функция для получения токена с дополнительной проверкой
const getToken = () => {
  try {
    // Сначала пробуем localStorage
    let token = localStorage.getItem('access_token');
    if (token) {
      console.log('🔑 Токен найден в localStorage');
      return token;
    }
    
    // Если в localStorage нет, пробуем sessionStorage
    token = sessionStorage.getItem('access_token');
    if (token) {
      console.log('🔑 Токен найден в sessionStorage');
      return token;
    }
    
    console.log('🔑 Токен не найден ни в localStorage, ни в sessionStorage');
    return null;
  } catch (error) {
    console.error('Ошибка доступа к хранилищу:', error);
    return null;
  }
};

// Добавляем интерцептор для автоматического добавления токена
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    console.log('🔑 Токен в запросе:', token ? 'ЕСТЬ' : 'НЕТ');
    console.log('📱 User Agent:', navigator.userAgent);
    console.log('🌐 URL запроса:', config.url);
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('❌ Ошибка в интерцепторе запроса:', error);
    return Promise.reject(error);
  }
);

// Добавляем интерцептор для обработки ошибок
api.interceptors.response.use(
  (response) => {
    console.log('✅ Успешный ответ:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('❌ Ошибка ответа:', error.response?.status, error.config?.url);
    console.error('📄 Детали ошибки:', error.response?.data);
    
    if (error.response?.status === 401) {
      console.log('🚪 401 ошибка - очищаем токен и перенаправляем');
      try {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
      } catch (e) {
        console.error('Ошибка очистки localStorage:', e);
      }
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

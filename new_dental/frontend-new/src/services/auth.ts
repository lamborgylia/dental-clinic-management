import api from './api';

export interface LoginCredentials {
  phone: string;
  password: string;
}

export interface User {
  id: number;
  full_name: string;
  phone: string;
  role: string;
  clinic_id: number | null;
  is_active: boolean;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const formData = new URLSearchParams();
    formData.append('username', credentials.phone);
    formData.append('password', credentials.password);

    const response = await api.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    return response.data;
  }

  logout(): void {
    try {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
    } catch (error) {
      console.error('Ошибка при выходе из localStorage:', error);
    }
  }

  getToken(): string | null {
    try {
      // Сначала пробуем localStorage
      let token = localStorage.getItem('access_token');
      if (token) return token;
      
      // Если в localStorage нет, пробуем sessionStorage
      token = sessionStorage.getItem('access_token');
      return token;
    } catch (error) {
      console.error('Ошибка получения токена из хранилища:', error);
      return null;
    }
  }

  getUser(): User | null {
    try {
      // Сначала пробуем localStorage
      let userStr = localStorage.getItem('user');
      if (userStr) return JSON.parse(userStr);
      
      // Если в localStorage нет, пробуем sessionStorage
      userStr = sessionStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Ошибка получения пользователя из хранилища:', error);
      return null;
    }
  }

  isAuthenticated(): boolean {
    return !!this.getToken() && !!this.getUser();
  }
}

export const authService = new AuthService();

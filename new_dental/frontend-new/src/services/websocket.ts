import { api } from './api';

export interface WebSocketMessage {
  type: 'appointment_created' | 'appointment_updated' | 'pong';
  data?: any;
  message?: string;
}

export interface AppointmentData {
  id: number;
  patient_id: number;
  doctor_id: number;
  appointment_datetime: string;
  status: string;
  service_type: string;
  notes: string;
  patient_name: string;
  patient_phone: string;
  created_at?: string;
  updated_at?: string;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private doctorId: number | null = null;
  private userId: number | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private messageHandlers: Map<string, (data: any) => void> = new Map();

  constructor() {
    this.setupMessageHandlers();
  }

  private setupMessageHandlers() {
    // Обработчик для новых записей
    this.messageHandlers.set('appointment_created', (data: AppointmentData) => {
      console.log('📡 Получено уведомление о новой записи:', data);
      // Вызываем callback для обновления календаря
      this.onAppointmentCreated?.(data);
    });

    // Обработчик для обновленных записей
    this.messageHandlers.set('appointment_updated', (data: AppointmentData) => {
      console.log('📡 Получено уведомление об обновлении записи:', data);
      // Вызываем callback для обновления календаря
      this.onAppointmentUpdated?.(data);
    });

    // Обработчик для pong сообщений
    this.messageHandlers.set('pong', (data: any) => {
      console.log('📡 WebSocket соединение активно');
    });
  }

  // Callbacks для обработки событий
  public onAppointmentCreated: ((data: AppointmentData) => void) | null = null;
  public onAppointmentUpdated: ((data: AppointmentData) => void) | null = null;

  async connect(doctorId: number, userId?: number) {
    if (this.isConnecting || this.ws?.readyState === WebSocket.OPEN) {
      console.log('🔌 WebSocket уже подключен или подключается');
      return;
    }

    this.isConnecting = true;
    this.doctorId = doctorId;
    this.userId = userId || null;

    try {
      // Получаем токен из localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('❌ Токен не найден для WebSocket подключения');
        return;
      }

      // Определяем URL для WebSocket
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.hostname;
      const port = window.location.hostname === 'localhost' ? ':8001' : '';
      const wsUrl = `${protocol}//${host}${port}/ws/appointments/${doctorId}`;

      console.log('🔌 Подключаемся к WebSocket:', wsUrl);

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('✅ WebSocket подключен для врача', doctorId);
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        
        // Отправляем токен авторизации (если нужно)
        this.sendAuthToken(token);
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('📨 Получено WebSocket сообщение:', message);

          const handler = this.messageHandlers.get(message.type);
          if (handler) {
            handler(message.data);
          } else {
            console.warn('⚠️ Неизвестный тип сообщения:', message.type);
          }
        } catch (error) {
          console.error('❌ Ошибка парсинга WebSocket сообщения:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('🔌 WebSocket соединение закрыто:', event.code, event.reason);
        this.isConnecting = false;
        this.ws = null;

        // Попытка переподключения
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        } else {
          console.error('❌ Превышено максимальное количество попыток переподключения');
        }
      };

      this.ws.onerror = (error) => {
        console.error('❌ Ошибка WebSocket:', error);
        this.isConnecting = false;
      };

    } catch (error) {
      console.error('❌ Ошибка создания WebSocket соединения:', error);
      this.isConnecting = false;
    }
  }

  private sendAuthToken(token: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      // Отправляем токен как первое сообщение
      this.ws.send(JSON.stringify({
        type: 'auth',
        token: token
      }));
    }
  }

  private scheduleReconnect() {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`🔄 Попытка переподключения ${this.reconnectAttempts}/${this.maxReconnectAttempts} через ${delay}ms`);
    
    setTimeout(() => {
      if (this.doctorId) {
        this.connect(this.doctorId, this.userId || undefined);
      }
    }, delay);
  }

  disconnect() {
    if (this.ws) {
      console.log('🔌 Отключаем WebSocket');
      this.ws.close();
      this.ws = null;
    }
    this.doctorId = null;
    this.userId = null;
    this.reconnectAttempts = 0;
  }

  sendPing() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'ping',
        timestamp: Date.now()
      }));
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  getConnectionState(): string {
    if (!this.ws) return 'disconnected';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      case WebSocket.CLOSING:
        return 'closing';
      case WebSocket.CLOSED:
        return 'closed';
      default:
        return 'unknown';
    }
  }
}

// Создаем глобальный экземпляр сервиса
export const websocketService = new WebSocketService();

// Экспортируем для использования в компонентах
export default websocketService;

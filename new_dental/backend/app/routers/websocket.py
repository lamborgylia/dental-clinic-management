from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from typing import List, Dict
import json
import asyncio
from ..core.dependencies import get_current_user_from_token
from ..models.user import User

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        # Храним активные соединения по doctor_id
        self.active_connections: Dict[int, List[WebSocket]] = {}
        # Храним соединения по user_id для общих уведомлений
        self.user_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, doctor_id: int = None, user_id: int = None):
        await websocket.accept()
        
        # Добавляем соединение для конкретного врача
        if doctor_id:
            if doctor_id not in self.active_connections:
                self.active_connections[doctor_id] = []
            self.active_connections[doctor_id].append(websocket)
            print(f"🔌 WebSocket подключен для врача {doctor_id}")
        
        # Добавляем соединение для пользователя
        if user_id:
            if user_id not in self.user_connections:
                self.user_connections[user_id] = []
            self.user_connections[user_id].append(websocket)
            print(f"🔌 WebSocket подключен для пользователя {user_id}")

    def disconnect(self, websocket: WebSocket, doctor_id: int = None, user_id: int = None):
        # Удаляем соединение для врача
        if doctor_id and doctor_id in self.active_connections:
            if websocket in self.active_connections[doctor_id]:
                self.active_connections[doctor_id].remove(websocket)
                if not self.active_connections[doctor_id]:
                    del self.active_connections[doctor_id]
                print(f"🔌 WebSocket отключен для врача {doctor_id}")
        
        # Удаляем соединение для пользователя
        if user_id and user_id in self.user_connections:
            if websocket in self.user_connections[user_id]:
                self.user_connections[user_id].remove(websocket)
                if not self.user_connections[user_id]:
                    del self.user_connections[user_id]
                print(f"🔌 WebSocket отключен для пользователя {user_id}")

    async def send_personal_message(self, message: str, websocket: WebSocket):
        try:
            await websocket.send_text(message)
        except Exception as e:
            print(f"❌ Ошибка отправки сообщения: {e}")

    async def broadcast_to_doctor(self, message: str, doctor_id: int):
        """Отправить сообщение всем подключенным клиентам конкретного врача"""
        if doctor_id in self.active_connections:
            disconnected = []
            for connection in self.active_connections[doctor_id]:
                try:
                    await connection.send_text(message)
                except Exception as e:
                    print(f"❌ Ошибка отправки врачу {doctor_id}: {e}")
                    disconnected.append(connection)
            
            # Удаляем отключенные соединения
            for connection in disconnected:
                self.active_connections[doctor_id].remove(connection)

    async def broadcast_to_user(self, message: str, user_id: int):
        """Отправить сообщение всем подключенным клиентам конкретного пользователя"""
        if user_id in self.user_connections:
            disconnected = []
            for connection in self.user_connections[user_id]:
                try:
                    await connection.send_text(message)
                except Exception as e:
                    print(f"❌ Ошибка отправки пользователю {user_id}: {e}")
                    disconnected.append(connection)
            
            # Удаляем отключенные соединения
            for connection in disconnected:
                self.user_connections[user_id].remove(connection)

    async def broadcast_appointment_update(self, appointment_data: dict, doctor_id: int = None, user_id: int = None):
        """Отправить обновление записи на прием"""
        message = json.dumps({
            "type": "appointment_update",
            "data": appointment_data
        })
        
        if doctor_id:
            await self.broadcast_to_doctor(message, doctor_id)
        
        if user_id:
            await self.broadcast_to_user(message, user_id)

    async def broadcast_appointment_created(self, appointment_data: dict, doctor_id: int = None, user_id: int = None):
        """Отправить уведомление о новой записи"""
        message = json.dumps({
            "type": "appointment_created",
            "data": appointment_data
        })
        
        if doctor_id:
            await self.broadcast_to_doctor(message, doctor_id)
        
        if user_id:
            await self.broadcast_to_user(message, user_id)

# Глобальный менеджер соединений
manager = ConnectionManager()

@router.websocket("/ws/appointments/{doctor_id}")
async def websocket_endpoint(websocket: WebSocket, doctor_id: int):
    """WebSocket endpoint для real-time обновлений записей врача"""
    await manager.connect(websocket, doctor_id=doctor_id)
    
    try:
        while True:
            # Ждем сообщения от клиента (ping/pong для поддержания соединения)
            data = await websocket.receive_text()
            
            # Отправляем подтверждение
            await manager.send_personal_message(json.dumps({
                "type": "pong",
                "message": "Соединение активно"
            }), websocket)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, doctor_id=doctor_id)
        print(f"🔌 WebSocket отключен для врача {doctor_id}")

@router.websocket("/ws/user/{user_id}")
async def websocket_user_endpoint(websocket: WebSocket, user_id: int):
    """WebSocket endpoint для общих уведомлений пользователя"""
    await manager.connect(websocket, user_id=user_id)
    
    try:
        while True:
            # Ждем сообщения от клиента
            data = await websocket.receive_text()
            
            # Отправляем подтверждение
            await manager.send_personal_message(json.dumps({
                "type": "pong",
                "message": "Соединение активно"
            }), websocket)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id=user_id)
        print(f"🔌 WebSocket отключен для пользователя {user_id}")

# Функции для использования в других роутерах
async def notify_appointment_created(appointment_data: dict, doctor_id: int = None, user_id: int = None):
    """Уведомить о создании новой записи"""
    await manager.broadcast_appointment_created(appointment_data, doctor_id, user_id)

async def notify_appointment_updated(appointment_data: dict, doctor_id: int = None, user_id: int = None):
    """Уведомить об обновлении записи"""
    await manager.broadcast_appointment_update(appointment_data, doctor_id, user_id)

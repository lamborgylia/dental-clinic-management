from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..core.database import get_db
from ..core.dependencies import require_medical_staff
from ..models.user import User
from ..models.treatment_plan import TreatmentPlan, TreatmentPlanService
from ..schemas.treatment_plan import TreatmentPlanCreate, TreatmentPlanUpdate, TreatmentPlanResponse, TreatmentPlanServiceResponse

router = APIRouter(prefix="/treatment-plans", tags=["treatment_plans"])


@router.get("/", response_model=List[TreatmentPlanResponse])
async def get_treatment_plans(
    skip: int = 0,
    limit: int = 100,
    patient_id: int = None,
    doctor_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_medical_staff)
):
    from ..models.patient import Patient
    from ..models.treatment_plan import TreatmentPlanService
    
    query = db.query(TreatmentPlan).join(Patient, TreatmentPlan.patient_id == Patient.id)
    
    if patient_id:
        query = query.filter(TreatmentPlan.patient_id == patient_id)
    if doctor_id:
        query = query.filter(TreatmentPlan.doctor_id == doctor_id)
    
    treatment_plans = query.offset(skip).limit(limit).all()
    
    print(f"🔍 Найдено планов лечения: {len(treatment_plans)}")
    
    # Преобразуем в формат с данными пациента
    result = []
    for plan in treatment_plans:
        patient = db.query(Patient).filter(Patient.id == plan.patient_id).first()
        
        # Загружаем услуги для зубов из плана лечения
        tooth_services = db.query(TreatmentPlanService).filter(
            TreatmentPlanService.treatment_plan_id == plan.id
        ).all()
        
        # Группируем услуги по зубам
        teeth_services_dict = {}
        services_list = []
        selected_teeth = set()
        total_cost = 0
        
        for tooth_service in tooth_services:
            tooth_id = tooth_service.tooth_id
            service_id = tooth_service.service_id
            
            if tooth_id not in teeth_services_dict:
                teeth_services_dict[tooth_id] = []
            
            teeth_services_dict[tooth_id].append(service_id)
            # Добавляем объект услуги вместо ID
            services_list.append(TreatmentPlanServiceResponse(
                id=tooth_service.id,
                service_id=tooth_service.service_id,
                tooth_id=tooth_service.tooth_id,
                service_name=tooth_service.service_name,
                service_price=tooth_service.service_price,
                quantity=tooth_service.quantity,
                notes=tooth_service.notes
            ))
            selected_teeth.add(tooth_id)
            total_cost += tooth_service.service_price * tooth_service.quantity
        
        plan_dict = {
            "id": plan.id,
            "patient_id": plan.patient_id,
            "doctor_id": plan.doctor_id,
            "diagnosis": plan.diagnosis,
            "notes": plan.notes,
            "created_at": plan.created_at,
            "updated_at": plan.updated_at,
            "services": services_list,  # Список ID услуг
            "teeth_services": teeth_services_dict,  # Словарь зуб -> [услуги]
            "patient_name": patient.full_name if patient else None,
            "patient_phone": patient.phone if patient else None,
            "patient_iin": patient.iin if patient else None,
            "patient_birth_date": patient.birth_date.isoformat() if patient and patient.birth_date else None,
            "patient_allergies": patient.allergies if patient else None,
            "patient_chronic_diseases": patient.chronic_diseases if patient else None,
            "patient_contraindications": patient.contraindications if patient else None,
            "patient_special_notes": patient.special_notes if patient else None,
            "treatment_description": plan.notes,  # Используем notes как treatment_description
            "total_cost": total_cost,  # Рассчитанная стоимость
            "selected_teeth": list(selected_teeth),  # Список зубов
            "status": "active"
        }
        result.append(plan_dict)
        print(f"📋 План лечения ID {plan.id}: {len(services_list)} услуг, {len(selected_teeth)} зубов, стоимость: {total_cost}")
    
    print(f"✅ Возвращаем {len(result)} планов лечения")
    return result


@router.post("/", response_model=TreatmentPlanResponse)
async def create_treatment_plan(
    treatment_plan: TreatmentPlanCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_medical_staff)
):
    from ..models.patient import Patient
    
    # Create treatment plan
    db_treatment_plan = TreatmentPlan(
        patient_id=treatment_plan.patient_id,
        doctor_id=treatment_plan.doctor_id,
        diagnosis=treatment_plan.diagnosis,
        notes=treatment_plan.notes
    )
    db.add(db_treatment_plan)
    db.commit()
    db.refresh(db_treatment_plan)
    
    # Add services to treatment plan
    for service_data in treatment_plan.services:
        # Получаем информацию об услуге из базы данных
        from ..models.service import Service
        service = db.query(Service).filter(Service.id == service_data.service_id).first()
        
        db_service = TreatmentPlanService(
            treatment_plan_id=db_treatment_plan.id,
            service_id=service_data.service_id,
            tooth_id=service_data.tooth_id or 0,  # Используем переданный tooth_id или 0
            service_name=service_data.service_name or (service.name if service else "Неизвестная услуга"),  # Используем переданное имя или из БД
            service_price=service_data.service_price if service_data.service_price is not None else (service.price if service else 0.0),  # Используем переданную цену или из БД
            quantity=service_data.quantity,
            notes=service_data.notes
        )
        db.add(db_service)
    
    db.commit()
    db.refresh(db_treatment_plan)
    
    # Загружаем данные пациента для ответа
    patient = db.query(Patient).filter(Patient.id == db_treatment_plan.patient_id).first()
    
    # Загружаем созданные услуги
    created_services = db.query(TreatmentPlanService).filter(
        TreatmentPlanService.treatment_plan_id == db_treatment_plan.id
    ).all()
    
    # Преобразуем услуги в формат ответа
    services_list = []
    teeth_services_dict = {}
    selected_teeth = set()
    total_cost = 0
    
    for service in created_services:
        tooth_id = service.tooth_id
        service_id = service.service_id
        
        if tooth_id not in teeth_services_dict:
            teeth_services_dict[tooth_id] = []
        
        teeth_services_dict[tooth_id].append(service_id)
        services_list.append(TreatmentPlanServiceResponse(
            id=service.id,
            service_id=service.service_id,
            tooth_id=service.tooth_id,
            service_name=service.service_name,
            service_price=service.service_price,
            quantity=service.quantity,
            notes=service.notes
        ))
        selected_teeth.add(tooth_id)
        total_cost += service.service_price * service.quantity
    
    # Преобразуем в формат с данными пациента
    plan_dict = {
        "id": db_treatment_plan.id,
        "patient_id": db_treatment_plan.patient_id,
        "doctor_id": db_treatment_plan.doctor_id,
        "diagnosis": db_treatment_plan.diagnosis,
        "notes": db_treatment_plan.notes,
        "created_at": db_treatment_plan.created_at,
        "updated_at": db_treatment_plan.updated_at,
        "services": services_list,
        "teeth_services": teeth_services_dict,
        "patient_name": patient.full_name if patient else None,
        "patient_phone": patient.phone if patient else None,
        "patient_iin": patient.iin if patient else None,
        "patient_birth_date": patient.birth_date.isoformat() if patient and patient.birth_date else None,
        "patient_allergies": patient.allergies if patient else None,
        "patient_chronic_diseases": patient.chronic_diseases if patient else None,
        "patient_contraindications": patient.contraindications if patient else None,
        "patient_special_notes": patient.special_notes if patient else None,
        "treatment_description": db_treatment_plan.notes,
        "total_cost": total_cost,
        "selected_teeth": list(selected_teeth),
        "status": "active"
    }
    
    return plan_dict


@router.get("/patient/{patient_id}", response_model=List[TreatmentPlanResponse])
async def get_treatment_plans_by_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_medical_staff)
):
    """Получить планы лечения для конкретного пациента"""
    from ..models.patient import Patient
    from ..models.treatment_plan import TreatmentPlanService
    
    print(f"🔍 Поиск планов лечения для пациента ID: {patient_id}")
    treatment_plans = db.query(TreatmentPlan).filter(TreatmentPlan.patient_id == patient_id).all()
    print(f"📋 Найдено планов лечения: {len(treatment_plans)}")
    
    if not treatment_plans:
        print("❌ Планы лечения не найдены")
        return []
    
    # Преобразуем в формат с данными пациента
    result = []
    for plan in treatment_plans:
        patient = db.query(Patient).filter(Patient.id == plan.patient_id).first()
        
        # Загружаем услуги для зубов из плана лечения
        tooth_services = db.query(TreatmentPlanService).filter(
            TreatmentPlanService.treatment_plan_id == plan.id
        ).all()
        
        # Группируем услуги по зубам
        teeth_services_dict = {}
        services_list = []
        selected_teeth = set()
        total_cost = 0
        
        for tooth_service in tooth_services:
            tooth_id = tooth_service.tooth_id
            service_id = tooth_service.service_id
            
            if tooth_id not in teeth_services_dict:
                teeth_services_dict[tooth_id] = []
            
            teeth_services_dict[tooth_id].append(service_id)
            # Добавляем объект услуги вместо ID
            services_list.append(TreatmentPlanServiceResponse(
                id=tooth_service.id,
                service_id=tooth_service.service_id,
                tooth_id=tooth_service.tooth_id,
                service_name=tooth_service.service_name,
                service_price=tooth_service.service_price,
                quantity=tooth_service.quantity,
                notes=tooth_service.notes
            ))
            selected_teeth.add(tooth_id)
            total_cost += tooth_service.service_price * tooth_service.quantity
        
        plan_dict = {
            "id": plan.id,
            "patient_id": plan.patient_id,
            "doctor_id": plan.doctor_id,
            "diagnosis": plan.diagnosis,
            "notes": plan.notes,
            "created_at": plan.created_at,
            "updated_at": plan.updated_at,
            "services": services_list,  # Список ID услуг
            "teeth_services": teeth_services_dict,  # Словарь зуб -> [услуги]
            "patient_name": patient.full_name if patient else None,
            "patient_phone": patient.phone if patient else None,
            "patient_iin": patient.iin if patient else None,
            "patient_birth_date": patient.birth_date.isoformat() if patient and patient.birth_date else None,
            "patient_allergies": patient.allergies if patient else None,
            "patient_chronic_diseases": patient.chronic_diseases if patient else None,
            "patient_contraindications": patient.contraindications if patient else None,
            "patient_special_notes": patient.special_notes if patient else None,
            "treatment_description": plan.notes,  # Используем notes как treatment_description
            "total_cost": total_cost,  # Рассчитанная стоимость
            "selected_teeth": list(selected_teeth),  # Список зубов
            "status": "active"
        }
        result.append(plan_dict)
        print(f"📋 План лечения ID {plan.id}: {len(services_list)} услуг, {len(selected_teeth)} зубов, стоимость: {total_cost}")
    
    print(f"✅ Возвращаем {len(result)} планов лечения")
    return result

@router.get("/{treatment_plan_id}", response_model=TreatmentPlanResponse)
async def get_treatment_plan(
    treatment_plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_medical_staff)
):
    treatment_plan = db.query(TreatmentPlan).filter(TreatmentPlan.id == treatment_plan_id).first()
    if treatment_plan is None:
        raise HTTPException(status_code=404, detail="Treatment plan not found")
    return treatment_plan


@router.put("/{treatment_plan_id}", response_model=TreatmentPlanResponse)
async def update_treatment_plan(
    treatment_plan_id: int,
    treatment_plan: TreatmentPlanUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_medical_staff)
):
    db_treatment_plan = db.query(TreatmentPlan).filter(TreatmentPlan.id == treatment_plan_id).first()
    if db_treatment_plan is None:
        raise HTTPException(status_code=404, detail="Treatment plan not found")
    
    # Обновляем основные поля плана
    for field, value in treatment_plan.dict(exclude_unset=True, exclude={'services'}).items():
        setattr(db_treatment_plan, field, value)
    
    # Если переданы услуги, обновляем их
    if treatment_plan.services is not None:
        # Удаляем старые услуги
        db.query(TreatmentPlanService).filter(
            TreatmentPlanService.treatment_plan_id == treatment_plan_id
        ).delete()
        
        # Добавляем новые услуги
        for service_data in treatment_plan.services:
            # Получаем информацию об услуге из базы данных
            from ..models.service import Service
            service = db.query(Service).filter(Service.id == service_data.service_id).first()
            
            db_service = TreatmentPlanService(
                treatment_plan_id=treatment_plan_id,
                service_id=service_data.service_id,
                tooth_id=service_data.tooth_id or 0,
                service_name=service_data.service_name or (service.name if service else ""),
                service_price=service_data.service_price or (service.price if service else 0.0),
                quantity=service_data.quantity,
                notes=service_data.notes
            )
            db.add(db_service)
    
    db.commit()
    db.refresh(db_treatment_plan)
    return db_treatment_plan


@router.delete("/{treatment_plan_id}")
async def delete_treatment_plan(
    treatment_plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_medical_staff)
):
    treatment_plan = db.query(TreatmentPlan).filter(TreatmentPlan.id == treatment_plan_id).first()
    if treatment_plan is None:
        raise HTTPException(status_code=404, detail="Treatment plan not found")
    
    db.delete(treatment_plan)
    db.commit()
    return {"message": "Treatment plan deleted"}


@router.post("/{treatment_plan_id}/update-from-order")
async def update_treatment_plan_from_order(
    treatment_plan_id: int,
    order_services: List[dict],  # Список услуг из наряда
    db: Session = Depends(get_db),
    current_user: User = Depends(require_medical_staff)
):
    """
    Обновляет план лечения на основе услуг из наряда.
    Добавляет новые зубы и услуги, которых нет в плане лечения.
    """
    # Получаем план лечения
    treatment_plan = db.query(TreatmentPlan).filter(TreatmentPlan.id == treatment_plan_id).first()
    if treatment_plan is None:
        raise HTTPException(status_code=404, detail="Treatment plan not found")
    
    # Получаем существующие услуги плана лечения
    existing_services = db.query(TreatmentPlanService).filter(
        TreatmentPlanService.treatment_plan_id == treatment_plan_id
    ).all()
    
    # Создаем множество существующих комбинаций зуб-услуга
    existing_combinations = set()
    for service in existing_services:
        existing_combinations.add((service.tooth_id, service.service_id))
    
    # Добавляем новые услуги из наряда
    new_services_added = 0
    for order_service in order_services:
        tooth_id = order_service.get('tooth_number', 0)
        service_id = order_service.get('service_id')
        service_name = order_service.get('service_name', '')
        service_price = order_service.get('service_price', 0.0)
        quantity = order_service.get('quantity', 1)
        
        # Проверяем, есть ли уже такая комбинация зуб-услуга
        if (tooth_id, service_id) not in existing_combinations:
            # Получаем информацию об услуге из базы данных
            from ..models.service import Service
            service = db.query(Service).filter(Service.id == service_id).first()
            
            db_service = TreatmentPlanService(
                treatment_plan_id=treatment_plan_id,
                service_id=service_id,
                tooth_id=tooth_id,
                service_name=service_name or (service.name if service else "Неизвестная услуга"),
                service_price=service_price if service_price is not None else (service.price if service else 0.0),
                quantity=quantity,
                notes=f"Добавлено из наряда"
            )
            db.add(db_service)
            new_services_added += 1
    
    db.commit()
    
    return {
        "message": f"Treatment plan updated successfully",
        "new_services_added": new_services_added,
        "treatment_plan_id": treatment_plan_id
    }


@router.get("/patient/{patient_id}/services", response_model=List[TreatmentPlanServiceResponse])
async def get_patient_treatment_plan_services(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_medical_staff)
):
    """Получить услуги из плана лечения для конкретного пациента"""
    
    # Находим план лечения для пациента
    treatment_plan = db.query(TreatmentPlan).filter(
        TreatmentPlan.patient_id == patient_id,
        TreatmentPlan.clinic_id == current_user.clinic_id
    ).first()
    
    if not treatment_plan:
        return []
    
    # Получаем услуги из плана лечения
    services = db.query(TreatmentPlanService).filter(
        TreatmentPlanService.treatment_plan_id == treatment_plan.id
    ).all()
    
    result = []
    for service in services:
        result.append(TreatmentPlanServiceResponse(
            id=service.id,
            treatment_plan_id=service.treatment_plan_id,
            service_id=service.service_id,
            service_name=service.service_name,
            service_price=service.service_price,
            tooth_number=service.tooth_number,
            quantity=service.quantity,
            is_completed=service.is_completed,
            notes=service.notes
        ))
    
    print(f"🔍 Найдено {len(result)} услуг в плане лечения для пациента {patient_id}")
    return result

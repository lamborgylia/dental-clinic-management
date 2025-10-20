-- Добавление поля treated_teeth в таблицу treatment_plans
-- Проверяем, существует ли уже поле treated_teeth
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'treatment_plans' 
        AND column_name = 'treated_teeth'
    ) THEN
        -- Добавляем поле treated_teeth
        ALTER TABLE treatment_plans 
        ADD COLUMN treated_teeth JSON;
        
        RAISE NOTICE 'Поле treated_teeth добавлено в таблицу treatment_plans';
    ELSE
        RAISE NOTICE 'Поле treated_teeth уже существует в таблице treatment_plans';
    END IF;
END $$;

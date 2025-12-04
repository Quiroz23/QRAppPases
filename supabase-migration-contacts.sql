-- ============================================
-- MIGRACIÓN: Agregar Campos de Contacto
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- Agregar campos de contacto a la tabla estudiantes
ALTER TABLE estudiantes
  ADD COLUMN IF NOT EXISTS telefono_apoderado VARCHAR(20),
  ADD COLUMN IF NOT EXISTS nombre_apoderado VARCHAR(100),
  ADD COLUMN IF NOT EXISTS telefono_apoderado_suplente VARCHAR(20),
  ADD COLUMN IF NOT EXISTS nombre_apoderado_suplente VARCHAR(100);

-- Comentarios para documentar los campos
COMMENT ON COLUMN estudiantes.telefono_apoderado IS 'Teléfono del apoderado principal para notificaciones WhatsApp (formato: +56912345678)';
COMMENT ON COLUMN estudiantes.nombre_apoderado IS 'Nombre del apoderado principal (ej: María Pérez - Madre)';
COMMENT ON COLUMN estudiantes.telefono_apoderado_suplente IS 'Teléfono del apoderado suplente (opcional)';
COMMENT ON COLUMN estudiantes.nombre_apoderado_suplente IS 'Nombre del apoderado suplente (opcional)';

-- Índice para búsquedas rápidas de estudiantes sin contacto
CREATE INDEX IF NOT EXISTS idx_estudiantes_sin_contacto 
  ON estudiantes(id) 
  WHERE telefono_apoderado IS NULL;

-- Índice para búsquedas rápidas de estudiantes con contacto
CREATE INDEX IF NOT EXISTS idx_estudiantes_con_contacto 
  ON estudiantes(id) 
  WHERE telefono_apoderado IS NOT NULL;

-- Verificación
SELECT 
  'Migración completada exitosamente!' as mensaje,
  COUNT(*) as total_estudiantes,
  COUNT(telefono_apoderado) as con_contacto,
  COUNT(*) - COUNT(telefono_apoderado) as sin_contacto
FROM estudiantes;

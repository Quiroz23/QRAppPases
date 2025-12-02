-- ============================================
-- ESQUEMA DE BASE DE DATOS PARA QRAPP PASES
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- ============================================
-- TABLA 1: Estudiantes
-- Guarda la información básica de cada estudiante
-- ============================================
CREATE TABLE IF NOT EXISTS estudiantes (
  -- id: Identificador único (se genera automáticamente)
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- run: RUT del estudiante (único, no puede repetirse)
  run VARCHAR(12) UNIQUE NOT NULL,
  
  -- nombre: Nombre completo
  nombre VARCHAR(100) NOT NULL,
  
  -- curso: Ejemplo "4° medioB"
  curso VARCHAR(20) NOT NULL,
  
  -- created_at: Cuándo se creó este registro
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- updated_at: Última actualización
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TABLA 2: Registros
-- Guarda cada inasistencia o atraso
-- ============================================
CREATE TABLE IF NOT EXISTS registros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- estudiante_id: ¿De qué estudiante es este registro?
  -- REFERENCES = "apunta a la tabla estudiantes"
  -- ON DELETE CASCADE = "si borro el estudiante, borra sus registros"
  estudiante_id UUID REFERENCES estudiantes(id) ON DELETE CASCADE NOT NULL,
  
  -- fecha: Día del registro
  fecha DATE NOT NULL,
  
  -- hora: Hora del registro
  hora TIME NOT NULL,
  
  -- tipo: "Inasistencias" o "Atrasos"
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('Inasistencias', 'Atrasos')),
  
  -- comentario: Observación opcional
  comentario TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TABLA 3: Justificaciones
-- Guarda quién justificó cada registro
-- ============================================
CREATE TABLE IF NOT EXISTS justificaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- registro_id: ¿Qué registro está justificando?
  -- UNIQUE = Solo puede haber 1 justificación por registro
  registro_id UUID UNIQUE REFERENCES registros(id) ON DELETE CASCADE NOT NULL,
  
  -- apoderado: Nombre de quien justifica
  apoderado VARCHAR(100) NOT NULL,
  
  -- fecha_justificacion: Cuándo se justificó
  fecha_justificacion DATE DEFAULT CURRENT_DATE,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- VISTA: Historial Completo
-- Une todas las tablas para facilitar las consultas
-- ============================================
CREATE OR REPLACE VIEW historial_completo AS
SELECT 
  r.id as registro_id,
  e.id as estudiante_id,
  e.run,
  e.nombre,
  e.curso,
  r.fecha,
  r.hora,
  r.tipo,
  r.comentario,
  -- Si existe justificación, muestra "Sí", sino "No"
  CASE WHEN j.id IS NOT NULL THEN 'Sí' ELSE 'No' END as justificado,
  j.apoderado,
  j.fecha_justificacion,
  r.created_at
FROM registros r
-- JOIN = "une las tablas"
JOIN estudiantes e ON r.estudiante_id = e.id
-- LEFT JOIN = "trae justificación si existe, sino NULL"
LEFT JOIN justificaciones j ON r.id = j.registro_id
ORDER BY r.fecha DESC, r.hora DESC;

-- ============================================
-- ÍNDICES: Hacen las búsquedas más rápidas
-- ============================================

-- Índice para buscar por RUN (lo usamos mucho)
CREATE INDEX IF NOT EXISTS idx_estudiantes_run ON estudiantes(run);

-- Índice para buscar registros por estudiante
CREATE INDEX IF NOT EXISTS idx_registros_estudiante ON registros(estudiante_id);

-- Índice para buscar por fecha
CREATE INDEX IF NOT EXISTS idx_registros_fecha ON registros(fecha);

-- Índice compuesto para búsquedas por estudiante y fecha
CREATE INDEX IF NOT EXISTS idx_registros_estudiante_fecha ON registros(estudiante_id, fecha DESC);

-- ============================================
-- FUNCIÓN: Actualizar updated_at automáticamente
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at en estudiantes
CREATE TRIGGER update_estudiantes_updated_at BEFORE UPDATE ON estudiantes
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- POLÍTICAS DE SEGURIDAD (Row Level Security)
-- Por ahora las deshabilitamos para facilitar el desarrollo
-- ============================================
ALTER TABLE estudiantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE registros ENABLE ROW LEVEL SECURITY;
ALTER TABLE justificaciones ENABLE ROW LEVEL SECURITY;

-- Permitir todo por ahora (cambiar en producción)
CREATE POLICY "Permitir todo en estudiantes" ON estudiantes FOR ALL USING (true);
CREATE POLICY "Permitir todo en registros" ON registros FOR ALL USING (true);
CREATE POLICY "Permitir todo en justificaciones" ON justificaciones FOR ALL USING (true);

-- ============================================
-- DATOS DE PRUEBA (Opcional)
-- Descomenta para insertar datos de ejemplo
-- ============================================

/*
-- Insertar estudiante de prueba
INSERT INTO estudiantes (run, nombre, curso) VALUES
('12345678-9', 'Juan Pérez', '4° medioB'),
('98765432-1', 'María González', '3° medioA');

-- Insertar registros de prueba
INSERT INTO registros (estudiante_id, fecha, hora, tipo, comentario)
SELECT 
  e.id,
  CURRENT_DATE,
  '10:15:00',
  'Atrasos',
  'Llegó 15 minutos tarde'
FROM estudiantes e WHERE e.run = '12345678-9';

-- Insertar justificación de prueba
INSERT INTO justificaciones (registro_id, apoderado)
SELECT 
  r.id,
  'María Pérez (Madre)'
FROM registros r
JOIN estudiantes e ON r.estudiante_id = e.id
WHERE e.run = '12345678-9'
LIMIT 1;
*/

-- ============================================
-- VERIFICACIÓN
-- ============================================
SELECT 'Base de datos creada exitosamente!' as mensaje;
SELECT 'Tablas creadas: ' || count(*) as total_tablas 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';

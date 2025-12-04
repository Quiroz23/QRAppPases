# 📱 QRAppPases - Sistema de Control de Asistencia

> Sistema de control de asistencia escolar mediante códigos QR con app móvil y dashboard web.

[![React Native](https://img.shields.io/badge/React%20Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

---

## 🎯 Descripción

Sistema modular para gestión de asistencia escolar que utiliza códigos QR para identificación rápida de estudiantes. El proyecto está dividido en tres componentes principales:

- **📱 App Móvil** (React Native/Expo) - Escaneo QR y registro en terreno
- **🌐 Dashboard Web** (Next.js) - Análisis y gestión administrativa
- **🗄️ Backend** (Supabase) - Base de datos PostgreSQL con API REST

### ✨ Características

- ✅ Escaneo de QR con validación en tiempo real
- ✅ Registro de inasistencias y atrasos
- ✅ Gestión de contactos de apoderados
- ✅ Justificación de registros
- ✅ Dashboard con estadísticas y gráficos
- ✅ Exportación a Excel
- ✅ Importación masiva de estudiantes
- ✅ Generación de credenciales QR

---

## 🚀 Inicio Rápido

### Requisitos

- Node.js 18+
- npm o yarn
- Cuenta en [Supabase](https://supabase.com)
- Expo Go (para testing en dispositivo)

### Instalación

```bash
# Clonar repositorio
git clone https://github.com/Quiroz23/QRAppPases
cd QRAppPases

# Instalar dependencias de la app móvil
npm install

# Instalar dependencias del dashboard
cd dashboard-web
npm install
cd ..
```

### Configuración de Supabase

1. Crea un proyecto en [Supabase](https://supabase.com)

2. Ejecuta el siguiente script en el SQL Editor:

```sql
-- Ejecutar supabase-schema.sql
-- Incluye tablas: estudiantes, registros, justificaciones
```

3. Copia las credenciales desde Project Settings → API

### Variables de Entorno

Crea `.env` en la raíz del proyecto:

```env
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

Crea `dashboard-web/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

### Ejecutar Proyecto

```bash
# Terminal 1: App móvil
npx expo start

# Terminal 2: Dashboard web
cd dashboard-web
npm run dev
```

- App móvil: Escanea el QR con Expo Go
- Dashboard: http://localhost:3000

---

## 📱 App Móvil

### Características

| Función | Descripción |
|---------|-------------|
| **Escaneo QR** | Lectura de códigos QR con validación de formato |
| **Registro de Atrasos** | Captura automática de fecha/hora, solicita contacto si no existe |
| **Registro de Inasistencias** | Igual que atrasos pero sin requerir contacto obligatorio |
| **Historial** | Vista de todos los registros de un estudiante con estado |
| **Comentarios** | Campo opcional para agregar contexto a cada registro |

### Tecnologías Utilizadas

- **Expo Camera** - Escaneo de códigos QR
- **Expo Linear Gradient** - Gradientes en UI
- **Moment.js** - Manejo de fechas
- **React Navigation** - Navegación entre pantallas
- **Supabase Client** - Conexión a base de datos

### Validaciones

- Formato de QR esperado (4 líneas con prefijos)
- Validación de teléfonos chilenos (+56 X XXXX XXXX)
- Auto-corrección de formato telefónico
- Normalización de RUN a minúsculas

---

## 🌐 Dashboard Web

### Funcionalidades

**📊 Panel Principal**
- Métricas en tiempo real
- Gráficos de barras (comparación mensual)
- Gráfico circular (distribución por tipo)

**🔍 Filtros**
- Por tipo: Inasistencias / Atrasos
- Por estado: Justificados / Pendientes
- Combinables entre sí

**📥 Exportación**
- Formato Excel (.xlsx)
- Incluye todos los campos
- Nombres de columnas en español

**📤 Importación Masiva**
- Subida de Excel con estudiantes
- Validación de formato
- Inserción por lotes

**🎫 Credenciales**
- Generación de PDFs con códigos QR
- Layout optimizado para impresión
- 4 credenciales por página

**👥 Gestión de Estudiantes**
- Tabla con búsqueda y filtros
- Edición inline de datos
- Paginación automática

### Stack Técnico

- **Next.js 15** - Framework React
- **Tailwind CSS** - Estilos
- **Recharts** - Gráficos interactivos
- **jsPDF** - Generación de PDFs
- **xlsx** - Procesamiento de Excel
- **QRCode** - Generación de códigos QR

---

## 🗄️ Base de Datos

### Esquema Completo

```sql
estudiantes
├── id (UUID, PK)
├── run (VARCHAR, UNIQUE)
├── nombres (VARCHAR)
├── apellido_paterno (VARCHAR)
├── apellido_materno (VARCHAR)
├── grado (VARCHAR)
├── letra (VARCHAR)
├── nombre_apoderado (VARCHAR, NULL)
├── telefono_apoderado (VARCHAR, NULL)
└── created_at (TIMESTAMP)

registros
├── id (UUID, PK)
├── estudiante_id (UUID, FK → estudiantes)
├── fecha (DATE)
├── hora (TIME)
├── tipo (VARCHAR) -- 'Inasistencias' | 'Atrasos'
├── comentario (TEXT, NULL)
└── created_at (TIMESTAMP)

justificaciones
├── id (UUID, PK)
├── registro_id (UUID, FK → registros, UNIQUE)
├── apoderado (VARCHAR)
├── fecha_justificacion (DATE)
└── created_at (TIMESTAMP)
```

### Patrones Utilizados

**Upsert Pattern**
```typescript
// Crea o actualiza estudiante por RUN
.upsert({ run, ... }, { onConflict: 'run' })
```

**Relaciones**
- `estudiantes` → `registros` (1:N)
- `registros` → `justificaciones` (1:1)

---

## 🚀 Deployment

### App Móvil

Para generar builds de producción con Expo:

```bash
# Configurar EAS (primera vez)
npm install -g eas-cli
eas login
eas build:configure

# Build APK para Android
eas build --platform android --profile preview

# Build para iOS (requiere cuenta Apple Developer)
eas build --platform ios
```

### Dashboard Web

El dashboard es una aplicación Next.js estándar que puede desplegarse en cualquier servicio que soporte Node.js:

**Opción 1: Servidor propio**
```bash
cd dashboard-web
npm run build
npm start
```

**Opción 2: Plataforma como servicio (Vercel, Netlify, Railway, etc.)**
```bash
cd dashboard-web
npm run build
```

Asegúrate de configurar las variables de entorno:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 🛠️ Stack Tecnológico

### Frontend Móvil
- **React Native** - Framework
- **Expo SDK 52** - Suite de herramientas
- **TypeScript** - Tipado estático
- **Expo Camera** - Escaneo QR
- **Expo Linear Gradient** - UI

### Frontend Web
- **Next.js 15** - Framework React
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Estilos utility-first
- **Recharts** - Gráficos
- **jsPDF + QRCode** - Generación PDF/QR

### Backend
- **Supabase** - BaaS (Backend as a Service)
- **PostgreSQL** - Base de datos relacional
- **Supabase Auth** - Autenticación (opcional)
- **Row Level Security** - Políticas de acceso

---

## 📂 Estructura del Proyecto

```
QRAppPases/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx          # Menú principal
│   │   ├── QRScanner.tsx       # Scanner de QR
│   │   └── Historial.tsx       # Vista historial
│   └── _layout.tsx
├── dashboard-web/
│   ├── app/
│   │   ├── page.tsx            # Dashboard principal
│   │   ├── students/           # Gestión estudiantes
│   │   ├── credentials/        # Generación QR
│   │   └── import/             # Importación Excel
│   └── components/
├── lib/
│   └── supabase.ts             # Cliente Supabase
├── supabase-schema.sql         # Schema inicial
└── package.json
```

---

## 🤝 Contribuir

Si deseas contribuir:

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/mejora`)
3. Commit cambios (`git commit -m 'feat: nueva funcionalidad'`)
4. Push (`git push origin feature/mejora`)
5. Abre un Pull Request

---
## 👨‍💻 Autor

**Cristian Quiroz**
- GitHub: [@Quiroz23](https://github.com/Quiroz23)
- Proyecto: [QRAppPases](https://github.com/Quiroz23/QRAppPases)

---

## 📞 Soporte

¿Problemas o preguntas? Abre un [issue](https://github.com/Quiroz23/QRAppPases/issues)

---

<div align="center">

**⭐ Si te gusta este proyecto, dale una estrella en GitHub ⭐**

© 2025 Cristian Quiroz. Todos los derechos reservados.

</div>

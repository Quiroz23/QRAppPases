# 📱 QRAppPases - Sistema de Control de Asistencia

> Sistema completo de control de asistencia escolar mediante códigos QR, con app móvil y dashboard web.

[![React Native](https://img.shields.io/badge/React%20Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

---

## 🎯 Descripción

**QRAppPases** es un sistema moderno y escalable para el control de asistencia escolar, compuesto por:

- **📱 App Móvil** (React Native/Expo) - Para profesores en terreno
- **🌐 Dashboard Web** (Next.js) - Para administradores
- **🗄️ Base de Datos** (Supabase PostgreSQL) - Backend robusto

### ✨ Características Principales

- ✅ Registro de inasistencias y atrasos mediante QR
- ✅ Justificación de registros
- ✅ Historial completo por estudiante
- ✅ Dashboard web con estadísticas en tiempo real
- ✅ Exportación a Excel
- ✅ Gráficos interactivos
- ✅ 100% gratis y sin límites

---

## 🚀 Inicio Rápido

### Requisitos Previos

- Node.js 18+
- Cuenta en [Supabase](https://supabase.com) (gratis)
- Expo Go app (para testing móvil)

### Instalación

```bash
# Clonar repositorio
git clone https://github.com/Quiroz23/QRAppPases
cd QRAppPases

# Instalar dependencias
npm install

# Instalar dependencias del dashboard
cd dashboard-web
npm install
cd ..
```

### Configuración

1. **Crear proyecto en Supabase:**
   - Ve a https://supabase.com
   - Crea un nuevo proyecto
   - Ejecuta el script `supabase-schema.sql` en el SQL Editor

2. **Configurar variables de entorno:**

   Crea `.env` en la raíz:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=tu_url_de_supabase
   EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_key_de_supabase
   ```

   Crea `dashboard-web/.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_key_de_supabase
   ```

3. **Iniciar aplicaciones:**

   ```bash
   # App móvil
   npx expo start

   # Dashboard web (en otra terminal)
   cd dashboard-web
   npm run dev
   ```

---

## 📱 App Móvil

### Funcionalidades

| Función | Descripción |
|---------|-------------|
| **Registrar Inasistencia** | Escanea QR del estudiante para registrar inasistencia |
| **Registrar Atraso** | Escanea QR del estudiante para registrar atraso |
| **Justificar Registros** | Permite justificar inasistencias/atrasos con nombre del apoderado |
| **Ver Historial** | Muestra historial completo del estudiante con estado de justificación |

### Capturas de Pantalla

```
[Menú Principal] → [Escanear QR] → [Confirmación]
```

---
### Funcionalidades

- **📊 Estadísticas en Tiempo Real**
  - Total de registros
  - Inasistencias vs Atrasos
  - Registros justificados
  
- **📈 Gráficos Interactivos**
  - Gráfico de barras (comparación)
  - Gráfico circular (porcentajes)

- **🔍 Filtros Avanzados**
  - Por tipo (Inasistencias/Atrasos)
  - Por estado (Justificados/Pendientes)

- **📥 Exportación a Excel**
  - Descarga todos los registros
  - Formato .xlsx compatible

---

## 🗄️ Base de Datos

### Esquema

```
estudiantes
├── id (UUID)
├── run (VARCHAR, UNIQUE)
├── nombre (VARCHAR)
└── curso (VARCHAR)

registros
├── id (UUID)
├── estudiante_id (FK)
├── fecha (DATE)
├── hora (TIME)
├── tipo (VARCHAR)
└── comentario (TEXT)

justificaciones
├── id (UUID)
├── registro_id (FK, UNIQUE)
├── apoderado (VARCHAR)
└── fecha_justificacion (DATE)
```

---

## 🚀 Deployment

### Dashboard Web en Vercel

```bash
cd dashboard-web
npm install -g vercel
vercel login
vercel
```

Configura las variables de entorno en Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---


## 🛠️ Tecnologías

### App Móvil
- React Native / Expo
- TypeScript
- Expo Camera
- Supabase JS

### Dashboard Web
- Next.js 16
- TypeScript
- Tailwind CSS
- Recharts
- xlsx

### Backend
- Supabase (PostgreSQL)
- Row Level Security
- Real-time subscriptions

---

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más información.

---

## 👨‍💻 Autor

**Cristian Quiroz**
- GitHub: [@Quiroz23](https://github.com/Quiroz23)
- Proyecto: [QRAppPases](https://github.com/Quiroz23/QRAppPases)

---

## 🙏 Agradecimientos

- [Supabase](https://supabase.com) por el backend gratuito
- [Expo](https://expo.dev) por simplificar React Native
- [Vercel](https://vercel.com) por el hosting gratuito

---

## 📞 Soporte

¿Tienes preguntas? Abre un [issue](https://github.com/Quiroz23/QRAppPases/issues)

---

<div align="center">

**⭐ Si te gusta este proyecto, dale una estrella en GitHub ⭐**

© 2025 Cristian Quiroz. Todos los derechos reservados.


</div>

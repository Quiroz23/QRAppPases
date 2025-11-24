# 🌳 Árbol de la Vida - Sistema de Control de Pases (QRAppPases)

> Aplicación móvil desarrollada para la Práctica Profesional, diseñada para digitalizar y agilizar el control de asistencia, atrasos y justificaciones escolares mediante tecnología QR.

[![GitHub Repo](https://img.shields.io/badge/GitHub-Ver_Repositorio-black?logo=github)](https://github.com/Quiroz23/QRAppPases)
![Estado](https://img.shields.io/badge/Estado-Completado-success)
![Lenguaje](https://img.shields.io/badge/Lenguaje-TypeScript-blue)
![Stack](https://img.shields.io/badge/Stack-Expo_%7C_React_Native_%7C_Google_Sheets-61DAFB)

## 📖 Descripción Técnica

**QRAppPases** es una solución móvil integral que permite a los inspectores y personal administrativo gestionar el flujo de estudiantes en tiempo real. La aplicación moderniza los registros manuales mediante el escaneo de credenciales con códigos QR.

El sistema opera bajo una arquitectura **Serverless** híbrida:
1.  **Lectura:** Utiliza **SheetBest API** para consultas rápidas de historiales.
2.  **Escritura:** Conecta con **Google Apps Script** para el registro seguro de transacciones.
3.  **Base de Datos:** Google Sheets como backend en la nube.

## ⚙️ Módulos Principales

La aplicación cuenta con una navegación basada en pestañas (`Expo Router`) que orquesta tres flujos clave:

### 1. 📷 Escáner de Incidencias (`QRScanner`)
Permite el ingreso rápido de datos validando el formato del QR institucional.
* **Modos:** Inasistencias y Atrasos.
* **Funcionamiento:** Escanea el QR (RUN, Nombre, Curso), añade un comentario opcional y envía la transacción vía API.

### 2. ✅ Gestión de Justificaciones (`JustifyScanner`)
Herramienta para regularizar la situación del estudiante.
* **Lógica de Cruce:** Realiza una consulta paralela (`Promise.all`) entre el historial de faltas y el registro de justificaciones.
* **Filtrado Inteligente:** Muestra en la UI únicamente las incidencias que aún no han sido justificadas.
* **Acción:** Registra el nombre del apoderado y la fecha, actualizando el estado en tiempo real.

### 3. 📋 Historial del Estudiante (`HistorialScanner`)
Visualización completa del comportamiento del alumno.
* **Interfaz:** Lista cronológica con indicadores visuales de estado (✅ Justificado / ❌ Pendiente).
* **Detalle:** Despliega metadatos como fecha, hora y comentarios asociados.

## 🛠️ Tecnologías Utilizadas

### Frontend (Móvil)
* **Core:** [React Native](https://reactnative.dev/) + [Expo SDK](https://expo.dev/)
* **Lenguaje:** TypeScript (Interfaces estrictas para `Registro`, `Props`).
* **Cámara:** `expo-camera` (Componente `CameraView`).
* **Navegación:** Expo Router (File-based routing).
* **Http Client:** Axios.

### Backend (Data Layer)
* **Base de Datos:** Google Sheets.
* **APIs:** SheetBest (JSON API) + Google Apps Script (Macro Web App).

## 🚀 Instalación y Despliegue

Sigue estos pasos para ejecutar el proyecto localmente:

1.  **Clonar el repositorio:**
    ```bash
    git clone [https://github.com/Quiroz23/QRAppPases.git](https://github.com/Quiroz23/QRAppPases.git)
    cd QRAppPases
    ```

2.  **Instalar dependencias:**
    ```bash
    npm install
    ```

3.  **Ejecutar la aplicación:**
    ```bash
    npx expo start
    ```
    * Escanea el código QR resultante con la app **Expo Go** en tu dispositivo Android/iOS.

## 📂 Estructura del Código

```text
/app
├── (tabs)/
│   ├── index.tsx           # Dashboard principal
│   ├── QRScanner.tsx       # Lógica de escaneo y POST request
│   ├── JustifyScanner.tsx  # Lógica de validación y cruce de datos
│   └── HistorialScanner.tsx# Visualización de registros
├── components/             # Componentes UI reutilizables
└── hooks/                  # Custom hooks (useColorScheme, etc.)

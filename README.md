# 🌳 Árbol de la Vida - Sistema de Control de Pases (QRAppPases)

> Sistema integral para la gestión de asistencia, atrasos y justificaciones escolares mediante códigos QR, utilizando una arquitectura Serverless con Google Sheets.

[![GitHub Repo](https://img.shields.io/badge/GitHub-Ver_Repositorio-black?logo=github)](https://github.com/Quiroz23/QRAppPases)
![Estado](https://img.shields.io/badge/Estado-Completado-success)
![Stack](https://img.shields.io/badge/Stack-Expo_%7C_Google_Apps_Script-ffca28)
![Database](https://img.shields.io/badge/Database-Google_Sheets-34A853)

## 📖 Descripción Técnica

**QRAppPases** es una solución móvil que moderniza el registro de inspectores escolares. Reemplaza las bitácoras de papel por un sistema digital que escanea credenciales QR, permitiendo un flujo de datos en tiempo real entre el patio de la escuela y la administración.

El proyecto implementa una arquitectura **Backend-as-a-Service (BaaS)** personalizada:
1.  **Frontend:** App móvil en React Native (Expo) con TypeScript.
2.  **Backend:** API RESTful construida con **Google Apps Script**.
3.  **Base de Datos:** Google Sheets actuando como sistema de persistencia relacional.

## 🗄️ Esquema de Base de Datos (Google Sheets)

El sistema utiliza un libro de cálculo con dos hojas principales (`Historial` y `Justificaciones`) que siguen la siguiente estructura de columnas:

| Columna | Tipo | Descripción | Ejemplo |
| :--- | :--- | :--- | :--- |
| `run` | String | Identificador único del estudiante | `12345678-9` |
| `nombre` | String | Nombre completo | `Juan Pérez` |
| `curso` | String | Curso y letra | `4° medioB` |
| `hora` | Time | Hora del registro | `10:03` |
| `fecha` | Date | Fecha del evento (YYYY-MM-DD) | `2025-07-14` |
| `tipo` | String | Categoría del evento | `Inasistencias` / `Atrasos` |
| `justificado` | String/Bool | Estado de la falta | `Sí` / `No` |
| `comentario` | String | Observación opcional | `Llega sin pase` |
| `fecha_justic.`| Date | Fecha cuando se regularizó | `2025-07-15` |

## ☁️ Configuración del Backend (API)

El proyecto incluye un script de Google Apps Script (`backend.gs`) que expone los siguientes endpoints:

### Endpoints Disponibles

* **`GET`**: Obtiene registros filtrados por RUT.
    * *Params:* `?run=123...&sheet=Historial`
* **`POST`**: Inserta una nueva fila (Inasistencia o Atraso).
    * *Body:* JSON con los campos coincidentes a las cabeceras del Excel.
* **`PATCH`**: Actualiza el estado de `justificado` de un registro específico.

### Instalación del Backend
Para replicar el servidor:
1.  Crear una nueva hoja de cálculo en Google Sheets.
2.  Nombrar las hojas como `Historial` y `Justificaciones`.
3.  Ir a **Extensiones > Apps Script**.
4.  Copiar el contenido del archivo `backend.gs` (incluido en este repo).
5.  Desplegar como aplicación web (**Deploy > New Deployment**):
    * *Execute as:* Me.
    * *Who has access:* **Anyone** (Importante para que la App móvil pueda acceder).

## ⚙️ Módulos de la Aplicación Móvil

### 1. 📷 Registro (`QRScanner`)
Motor de escaneo optimizado. Parsea la data del código QR (Run, Nombre, Curso) y envía una petición `POST` al script de Google para registrar la incidencia instantáneamente.

### 2. ✅ Justificación Inteligente (`JustifyScanner`)
Módulo de auditoría. Cruza la información del historial con las justificaciones existentes.
* **Lógica:** Descarga ambos historiales y filtra localmente para mostrar solo aquello que está "Pendiente" (Rojo).
* **Acción:** Al justificar, envía los datos del apoderado y actualiza el estado a "Justificado" (Verde).

### 3. 📋 Visualizador (`HistorialScanner`)
Interfaz de usuario para revisar el comportamiento del alumno, diferenciando visualmente las faltas regularizadas de las pendientes.

## 🚀 Instalación del Frontend

1.  **Clonar el repositorio:**
    ```bash
    git clone [https://github.com/Quiroz23/QRAppPases.git](https://github.com/Quiroz23/QRAppPases.git)
    cd QRAppPases
    ```

2.  **Instalar dependencias:**
    ```bash
    npm install
    ```

3.  **Configurar Variables:**
    * Reemplazar la URL `API_URL` en los archivos de servicio con la URL de tu propio despliegue de Google Apps Script.

4.  **Ejecutar:**
    ```bash
    npx expo start
    ```

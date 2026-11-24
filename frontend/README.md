# Frontend — Vivero de Tortugas

Aplicación web en **React** que consume la API REST de Django del mismo repositorio. Permite manejar todo el proceso del vivero desde el navegador: playas y sectores, voluntarios, turnos de patrullaje, nidos, eclosiones y liberaciones, más una pantalla de inicio con los reportes.

Proyecto 2 del curso Desarrollo de Software IV — Universidad de Costa Rica, Sede del Pacífico.

---

## Tecnologías

| Herramienta | Para qué se usa |
|---|---|
| React 19 + Vite | Interfaz y servidor de desarrollo |
| React Router 7 | Navegación entre pantallas y rutas protegidas |
| Axios | Llamadas a la API, con el token agregado automáticamente |
| Bootstrap 5 + Bootstrap Icons | Diseño, tablas, formularios, ventanas y avisos |
| Oxlint | Revisión del código (`npm run lint`) |

## Requisitos

- **Node.js 20 o superior** (incluye npm).
- **El backend Django encendido** en `http://127.0.0.1:8000`. Ver el [README principal](../README.md) para instalarlo, crear la base de datos y cargar los datos de prueba (`python manage.py cargar_datos_demo`).

## Instalación y ejecución

Desde la carpeta raíz del repositorio:

```bash
cd frontend
npm install
copy .env.example .env      # Windows  (Linux/macOS: cp .env.example .env)
npm run dev
```

Abrir **http://localhost:5173**.

Hay que dejar encendidas dos terminales al mismo tiempo:

| Terminal | Carpeta | Comando |
|---|---|---|
| Backend | `vivero-tortugas-api` (con el `venv` activado) | `python manage.py runserver` |
| Frontend | `vivero-tortugas-api/frontend` | `npm run dev` |

### Variables de entorno

| Variable | Valor por defecto | Descripción |
|---|---|---|
| `VITE_API_URL` | `http://127.0.0.1:8000/api` | Dirección base de la API de Django |

Si el archivo `.env` no existe, se usa el valor por defecto.

### Otros comandos

| Comando | Qué hace |
|---|---|
| `npm run build` | Genera la versión de producción en `dist/` |
| `npm run preview` | Sirve la versión de `dist/` para revisarla |
| `npm run lint` | Revisa el código con Oxlint |

## Usuarios de prueba

Los crea el comando `cargar_datos_demo` del backend. Los tres usan la contraseña definida en `DEMO_PASSWORD` del `.env` del backend.

| Usuario | Rol | Qué puede hacer en la aplicación |
|---|---|---|
| `admin` | Administrador | Todo, incluido eliminar y administrar playas y sectores |
| `coordinador` | Coordinador | Crear y editar voluntarios, turnos, nidos, eclosiones y liberaciones |
| `consulta` | Consulta | Solo ver |

La matriz completa está en [`docs/FRONTEND.md`](../docs/FRONTEND.md#3-permisos-en-pantalla).

## Estructura

```
src/
├── api/                     Comunicación con Django
│   ├── cliente.js           Instancia de Axios: URL base, token y manejo del 401
│   ├── servicios.js         Una función por endpoint (playasApi, nidosApi, reportesApi…)
│   ├── errores.js           Convierte las respuestas 400/401/403/404/409 en mensajes claros
│   └── almacenamientoSesion.js  Guarda la sesión en localStorage
├── componentes/             Piezas reutilizables
│   ├── Layout.jsx           Menú superior y contenedor de las pantallas
│   ├── RutaProtegida.jsx    Manda al login si no hay sesión
│   ├── Tabla.jsx, Paginacion.jsx, CampoFormulario.jsx
│   ├── ModalConfirmacion.jsx, VentanaFormulario.jsx, EstadoCarga.jsx
├── contextos/
│   ├── ContextoSesion.jsx   Usuario, roles, iniciar y cerrar sesión
│   └── ContextoAvisos.jsx   Avisos verdes y rojos (toasts)
├── ganchos/
│   └── useListadoPaginado.js  Lista con filtros, página, carga y error en una línea
├── utilidades/
│   ├── permisos.js          Qué botones ve cada rol (mismas reglas del backend)
│   └── formatos.js          Fechas y listas de opciones (especies, estados, roles en turno)
├── paginas/                 Una carpeta por módulo de negocio
│   ├── Login.jsx, Dashboard.jsx, NoEncontrada.jsx
│   ├── vivero/              Playas, Sectores
│   ├── voluntarios/         Lista y formulario
│   ├── patrullajes/         Turnos y detalle del turno
│   ├── nidos/               Lista, formulario y detalle
│   └── nacimientos/         Eclosiones y Liberaciones
├── App.jsx                  Todas las rutas
└── main.jsx                 Punto de entrada (Bootstrap e íconos)
```

## Cómo funciona

1. **Login.** `Login.jsx` envía usuario y contraseña a `POST /api/auth/login/`. La respuesta trae el token y los roles, que se guardan en `localStorage` para que la sesión sobreviva al recargar.
2. **Token automático.** El interceptor de `cliente.js` agrega `Authorization: Token …` a cada solicitud.
3. **Sesión vencida.** Si la API responde **401**, `ContextoSesion` borra la sesión y `RutaProtegida` manda al login con el aviso "Su sesión expiró".
4. **Permisos.** `permisos.js` replica las reglas del backend para mostrar solo los botones permitidos. Aunque alguien forzara una acción, Django igual responde **403**.
5. **Errores.** `errores.js` coloca cada error 400 debajo de su campo del formulario y muestra los demás (403, 404, 409, sin conexión) en un aviso rojo.

## Ver la aplicación desde el celular (opcional)

La computadora y el celular deben estar en la misma red Wi-Fi.

1. Averiguar la IP de la computadora con `ipconfig` (por ejemplo `192.168.1.50`).
2. En el `.env` del **backend** agregar esa IP:
   ```
   ALLOWED_HOSTS=127.0.0.1,localhost,192.168.1.50
   CORS_ALLOWED_ORIGINS=http://localhost:5173,http://192.168.1.50:5173
   ```
3. Encender Django escuchando en la red: `python manage.py runserver 0.0.0.0:8000`
4. En el `.env` del **frontend**: `VITE_API_URL=http://192.168.1.50:8000/api`
5. Encender el frontend con `npm run dev -- --host` y abrir en el celular `http://192.168.1.50:5173`.

Si no carga, el Firewall de Windows puede estar bloqueando los puertos 8000 y 5173.

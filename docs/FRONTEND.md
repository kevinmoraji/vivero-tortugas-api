# Documento del frontend — Vivero de Tortugas

Complementa al [documento técnico del backend](DOCUMENTO_TECNICO.md). La instalación está en [`frontend/README.md`](../frontend/README.md).

## 1. Arquitectura

El frontend es una aplicación de una sola página (SPA) hecha con React. No tiene base de datos propia: toda la información la pide a la API de Django.

**Flujo de una acción:**

**pantalla (página) → servicio (`servicios.js`) → cliente Axios con token (`cliente.js`) → API Django → respuesta JSON → la pantalla se actualiza o muestra el error**

| Capa | Archivos | Responsabilidad |
|---|---|---|
| Rutas | `App.jsx`, `RutaProtegida.jsx` | Qué pantalla se ve en cada dirección y cuáles exigen sesión |
| Estado global | `ContextoSesion.jsx`, `ContextoAvisos.jsx` | Usuario y roles; avisos de éxito y error |
| Pantallas | `paginas/` | Una carpeta por módulo de negocio |
| Componentes | `componentes/` | Tabla, paginación, campos, ventanas y menú, compartidos por todos |
| Acceso a datos | `api/` | Llamadas a la API, token, sesión y traducción de errores |
| Reglas de interfaz | `utilidades/permisos.js` | Qué botones ve cada rol |

## 2. Pantallas y endpoints

| Ruta en el navegador | Pantalla | Endpoints que usa |
|---|---|---|
| `/login` | Inicio de sesión | `POST /auth/login/` |
| (menú) Cerrar sesión | — | `POST /auth/logout/` |
| `/` | Inicio (indicadores) | `GET /reportes/resumen-playas/`, `/reportes/proximos-a-eclosionar/`, `/reportes/ocupacion-vivero/`, `/reportes/liberaciones-por-mes/` |
| `/playas` | Playas (lista, crear, editar, eliminar) | `GET POST /playas/`, `PUT DELETE /playas/{id}/` |
| `/sectores` | Sectores del vivero | `GET POST /sectores/`, `PUT DELETE /sectores/{id}/`, `GET /playas/` (filtro) |
| `/voluntarios` | Lista de voluntarios | `GET /voluntarios/?search=&activo=&ordering=`, `DELETE /voluntarios/{id}/` |
| `/voluntarios/nuevo` y `/voluntarios/{id}/editar` | Formulario de voluntario | `POST /voluntarios/`, `GET PUT /voluntarios/{id}/` |
| `/turnos` | Turnos de patrullaje | `GET POST /turnos/?playa=&desde=&hasta=&con_cupo=`, `PUT DELETE /turnos/{id}/` |
| `/turnos/{id}` | Detalle del turno | `GET /turnos/{id}/`, `POST /turnos/{id}/asignar/`, `DELETE /turnos/{id}/asignaciones/{voluntario}/`, `GET /voluntarios/?activo=true` |
| `/nidos` | Lista de nidos | `GET /nidos/?search=&especie=&estado=&playa=&desde=&hasta=&ordering=`, `DELETE /nidos/{id}/` |
| `/nidos/nuevo` y `/nidos/{id}/editar` | Formulario de nido | `POST /nidos/`, `GET PUT /nidos/{id}/`, `GET /turnos/?playa=`, `GET /sectores/?playa=` |
| `/nidos/{id}` | Detalle del nido | `GET /nidos/{id}/`, `POST /nidos/{id}/marcar-perdido/` |
| `/eclosiones` | Eclosiones (lista, registrar, corregir, anular) | `GET POST /eclosiones/`, `PUT DELETE /eclosiones/{id}/`, `GET /nidos/?estado=INCUBANDO` |
| `/liberaciones` | Liberaciones (lista y registrar) | `GET POST /liberaciones/`, `GET /eclosiones/`, `GET /voluntarios/?activo=true` |
| cualquier otra | Página no encontrada | — |

Todas las listas usan la paginación de la API (10 registros por página, con `count` y `results`).

## 3. Permisos en pantalla

El frontend oculta los botones que el rol no puede usar. Son las mismas reglas de la matriz de permisos del backend ([documento técnico, sección 4](DOCUMENTO_TECNICO.md#4-matriz-de-permisos)), así que nunca se ofrece una acción que Django vaya a rechazar.

C = crear · E = editar · B = eliminar o anular · V = solo ver

| Pantalla | Consulta | Coordinador | Administrador |
|---|:-:|:-:|:-:|
| Inicio (reportes) | V | V | V |
| Playas | V | V | C E B |
| Sectores | V | V | C E B |
| Voluntarios | V | C E | C E B |
| Turnos | V | C E | C E B |
| Detalle del turno: asignar y retirar voluntarios | V | ✅ | ✅ |
| Nidos | V | C E | C E B |
| Detalle del nido: marcar como perdido | V | ✅ | ✅ |
| Eclosiones | V | C E | C E B |
| Liberaciones | V | C | C |

Liberaciones no tiene editar ni eliminar para ningún rol, porque el backend no lo permite (justificación en la sección 9 del documento técnico).

## 4. Manejo de errores

`api/errores.js` traduce cada respuesta de la API a un mensaje que el usuario entiende:

| Respuesta de la API | Qué ve el usuario |
|---|---|
| **400** con errores por campo | El mensaje de Django debajo de cada campo, en rojo, y un aviso "Revise los datos del formulario" |
| **400** de una regla de negocio general | Aviso rojo con el mensaje de Django (por ejemplo, "El turno ya alcanzó su cupo máximo") |
| **401** | La sesión se cierra y el login muestra "Su sesión expiró. Inicie sesión de nuevo." |
| **403** | Aviso "Su rol no tiene permiso para realizar esta operación" |
| **404** | Aviso "El registro solicitado no existe" (por ejemplo, un nido borrado) |
| **409** | Aviso con el conflicto (por ejemplo, eliminar un voluntario que ya tiene turnos) |
| Sin conexión | "No se pudo conectar con la API. Verifique que el backend Django esté encendido…" |

Mientras se carga una lista aparece un indicador, y si la carga falla, un botón **Reintentar**.

## 5. Escenarios de prueba

Probados con los datos de `cargar_datos_demo`. Cada escenario tiene su captura en `docs/capturas/`.

| # | Escenario | Usuario | Pasos | Resultado esperado |
|---|---|---|---|---|
| 1 | Login correcto y sesión persistente | `coordinador` | Iniciar sesión y recargar con F5 | Entra al Inicio con los indicadores; al recargar la sesión sigue activa |
| 2 | Login incorrecto | — | Usuario `coordinador` con una contraseña mala | Mensaje rojo "Usuario o contraseña incorrectos." y no entra |
| 3 | Ruta protegida | — | Sin sesión, abrir `http://localhost:5173/nidos` | Manda al login; al iniciar sesión vuelve a Nidos |
| 4 | Sesión vencida (401) | `coordinador` | Con la aplicación abierta, hacer `POST /api/auth/logout/` en Postman con un token del mismo usuario; luego hacer clic en cualquier opción del menú | Vuelve al login con el aviso "Su sesión expiró" |
| 5 | Permisos por rol | `consulta` | Recorrer Playas, Voluntarios, Turnos, Nidos y Eclosiones | No aparece ningún botón de crear, editar ni eliminar; solo puede ver |
| 6 | Búsqueda, filtros combinables y paginación | `coordinador` | En Nidos: buscar "OST", luego filtrar por playa + especie + estado; cambiar de página | La tabla muestra solo lo que cumple todos los filtros; "Limpiar filtros" la deja como al inicio |
| 7 | Validación de formulario | `coordinador` | Nuevo voluntario con cédula `123`; luego con `605550111` | Primero sale "La cédula debe tener 9 dígitos" debajo del campo; luego se guarda con aviso verde |
| 8 | Regla de negocio: turno de más de 8 horas | `coordinador` | Nuevo turno de 19:00 a 05:00 del día siguiente | Error debajo del campo "Fin": un turno no puede durar más de 8 horas |
| 9 | Regla de negocio: cupo lleno | `coordinador` | Turno con cupo 1: asignar un voluntario y después otro | El primero se asigna; con el segundo sale "El turno ya alcanzó su cupo máximo de voluntarios" |
| 10 | Decisión automática: eclosión | `coordinador` | Registrar la eclosión de un nido con más de 45 días; primero con una suma que no cuadra con los huevos y luego con la suma exacta | Primero sale el error del conteo; luego se guarda, el nido pasa a "Eclosionado" y su sector queda libre |
| 11 | Regla de negocio: liberar más crías de las que nacieron | `coordinador` | Registrar una liberación con más crías de las pendientes | Error "Solo quedan N crías pendientes de liberar" |
| 12 | Eliminar con registros relacionados (409) | `admin` | Eliminar un voluntario que ya tiene turnos (por ejemplo, Quesada Rojas) | Pide confirmación y luego avisa que no se puede eliminar porque tiene registros relacionados |

## 6. Capturas

Guardar en `docs/capturas/` con estos nombres:

| Archivo | Qué debe mostrar |
|---|---|
| `01-login.png` | Pantalla de login |
| `02-login-incorrecto.png` | Mensaje de usuario o contraseña incorrectos |
| `03-inicio.png` | Inicio con los indicadores, resumen por playa y ocupación |
| `04-sesion-expirada.png` | Login con el aviso "Su sesión expiró" |
| `05-consulta-sin-botones.png` | Una lista vista con el usuario `consulta` |
| `06-nidos-filtros.png` | Lista de nidos con filtros aplicados |
| `07-voluntario-error-cedula.png` | Formulario con el error de la cédula |
| `08-turno-8-horas.png` | Formulario de turno con el error del campo Fin |
| `09-cupo-lleno.png` | Detalle del turno con el aviso de cupo lleno |
| `10-eclosion.png` | Eclosión registrada y aviso de que el sector se liberó |
| `11-liberacion-excede.png` | Error de crías pendientes |
| `12-eliminar-409.png` | Aviso al eliminar un voluntario con turnos |
| `13-detalle-nido.png` | Detalle de un nido con voluntarios y eclosión |
| `14-celular.png` | (Opcional) la aplicación abierta en el celular |

## 7. Aportes en el Proyecto 2

Cada integrante trabajó su parte en una rama propia y la integró con un pull request revisado por otra persona.

| Integrante | Rama | Aportes | Revisó a |
|---|---|---|---|
| Kevin Mora Jiménez (kevinmoraji) | `feature/frontend-base`, `feature/estructura`, `feature/kevin-vivero-patrullajes` | Proyecto Vite, CORS en Django, cliente Axios y servicios, rutas, menú, componentes compartidos, Playas, Sectores, Turnos y asignación de voluntarios | AngJS11 |
| Jimena Fonseca Alvarado (jimeninis) | `feature/jimena-auth-nidos`, `feature/docs-frontend` | Login, sesión con manejo del 401, avisos, permisos por rol, módulo de nidos y documentación del frontend | kevinmoraji |
| Angelina Jiménez Salas (AngJS11) | `feature/angelina-dashboard-voluntarios-nacimientos` | Inicio con reportes, voluntarios (búsqueda y orden), eclosiones y liberaciones | jimeninis |

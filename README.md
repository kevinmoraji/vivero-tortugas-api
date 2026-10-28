# 🐢 Vivero de Tortugas API

API REST para la gestión de un **vivero de conservación de tortugas marinas** en playas del Pacífico de Costa Rica.

El sistema sigue el proceso completo de conservación:

**voluntarios patrullan la playa → encuentran un nido → lo reubican en un sector del vivero → el nido eclosiona → las crías se liberan al mar.**

A lo largo de ese proceso el sistema toma decisiones automáticas:
- Al registrar una eclosión, cierra el nido y deja libre su sector.
- Calcula la tasa de eclosión.
- Impide liberar más crías de las que nacieron.

Proyecto del curso Desarrollo de Software IV — Universidad de Costa Rica, Sede del Pacífico.

---

## Módulos de negocio

| # | Módulo (app) | Responsabilidad | Entradas → Salidas |
|---|---|---|---|
| 1 | `vivero` | Catálogo de playas y sectores del vivero | Datos de playa y sector → disponibilidad de sectores |
| 2 | `voluntarios` | Registro de voluntarios | Datos personales → voluntarios activos para turnos |
| 3 | `patrullajes` | Turnos nocturnos y asignación de voluntarios (N:M) | Playa, horario, voluntarios → turnos con cupo controlado |
| 4 | `nidos` | Nidos encontrados y sembrados en el vivero | Turno, sector, huevos → nido en incubación |
| 5 | `nacimientos` | Eclosiones y liberaciones de crías | Conteo de crías → nido cerrado, crías liberadas |

Además del modelo de negocio, el proyecto incluye estas apps de apoyo:
- `usuarios`: autenticación por token.
- `reportes`: consultas ORM.
- `core`: roles, permisos, manejo de errores y datos de prueba.

En [`docs/DOCUMENTO_TECNICO.md`](docs/DOCUMENTO_TECNICO.md) están:
- el diagrama ER,
- la matriz de permisos,
- las reglas de negocio,
- el catálogo de endpoints.

---

## Requisitos

- Python 3.11 o superior
- MySQL 8 o MariaDB 10.6 o superior. PostgreSQL también funciona si se cambia `DB_ENGINE`.
- Git
- Postman

## Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/<usuario>/vivero-tortugas-api.git
cd vivero-tortugas-api

# 2. Crear y activar el entorno virtual
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Linux / macOS

# 3. Instalar dependencias
pip install -r requirements.txt

# 4. Configurar variables de entorno
copy .env.example .env         # Windows   (cp en Linux/macOS)
# Edite .env: SECRET_KEY, DB_USER, DB_PASSWORD y DEMO_PASSWORD
```

## Crear la base de datos

En MySQL Workbench o en la consola de MySQL:

```sql
CREATE DATABASE vivero_tortugas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## Migraciones, roles y datos de prueba

```bash
python manage.py migrate
python manage.py cargar_datos_demo
```

`cargar_datos_demo` crea lo siguiente:

- **Los 3 roles** (grupos de Django): Administrador, Coordinador y Consulta.
- **3 usuarios de prueba**: `admin`, `coordinador` y `consulta`. Su contraseña es el valor de `DEMO_PASSWORD` en el `.env`.
- **Datos ficticios**:
  - 3 playas con 12 sectores cada una
  - 9 voluntarios
  - unos 60 turnos de los últimos 84 días
  - nidos, eclosiones y liberaciones coherentes entre sí

Para borrar los datos y volver a cargarlos:

```bash
python manage.py cargar_datos_demo --limpiar
```

## Superusuario (opcional)

```bash
python manage.py createsuperuser
```

Un superusuario tiene los mismos permisos que el rol Administrador.

## Ejecutar el servidor

```bash
python manage.py runserver
```

La API queda disponible en `http://127.0.0.1:8000/api/`.

## Pruebas automatizadas

```bash
python manage.py test                   # todas (50 pruebas)
python manage.py test nidos             # solo un módulo
python manage.py test -v 2 > docs/evidencia_pruebas.txt 2>&1   # guardar evidencia
```

> En MySQL, el usuario de la base de datos necesita permiso para crear la base `test_vivero_tortugas`.

## Postman

1. Importe los dos archivos de la carpeta `postman/`:
   - `vivero_tortugas.postman_collection.json` (48 solicitudes en 8 carpetas)
   - `vivero_tortugas.postman_environment.json`
2. Seleccione el entorno **Vivero Tortugas - Local**.
3. En la variable `demo_password` del entorno, escriba el mismo valor de `DEMO_PASSWORD` que tiene en su `.env`.
4. Ejecute la colección completa con **Run collection**, o solicitud por solicitud en orden.

Los tokens y los IDs se guardan solos en variables, así que la colección se puede ejecutar varias veces seguidas.

## Autenticación

```http
POST /api/auth/login/
{"username": "coordinador", "password": "..."}

→ {"token": "abc123...", "usuario": "coordinador", "roles": ["Coordinador"]}
```

En las demás solicitudes se envía el token en este encabezado:

```http
Authorization: Token abc123...
```

## Estructura del proyecto

```
config/         settings, urls
core/           roles, permisos por rol, paginación, manejo de errores, comando de datos demo
usuarios/       login, logout, perfil
vivero/         Playa, Sector
voluntarios/    Voluntario
patrullajes/    Turno, Asignacion (N:M) + services.py con reglas
nidos/          Nido
nacimientos/    Eclosion, Liberacion + services.py con reglas
reportes/       consultas.py con las consultas ORM
postman/        colección y entorno
docs/           documento técnico y plan de trabajo en Git
```

Cada solicitud recorre este flujo:

**solicitud → vista (ViewSet) → serializador / servicio → ORM → respuesta JSON**

## Limitaciones conocidas

- **No hay frontend.** Por requisito del proyecto, la API se usa desde Postman.
- **Los usuarios del sistema y los voluntarios son entidades separadas.** Un voluntario no inicia sesión; los registra un coordinador.
- **No hay notificaciones automáticas.** Por ejemplo, el sistema no avisa cuando un nido está por eclosionar. Esa información se consulta con `GET /api/reportes/proximos-a-eclosionar/`.
- **Las liberaciones no se pueden editar ni borrar**, por trazabilidad. Para corregir un error, el administrador debe anular la eclosión antes de que haya liberaciones.

## Equipo y aportes

| Integrante | Usuario GitHub | Aportes principales |
|---|---|---|
| (nombre completo) | kevinmoraji | Configuración inicial, módulo vivero, patrullajes, pruebas de vivero y patrullajes, colección de Postman |
| (nombre completo) | jimeninis | Autenticación, módulo nidos, datos base de pruebas, pruebas de usuarios y nidos, documentación |
| (Angelina Jiménez Salas) | AngJS11 | Módulo voluntarios, nacimientos, reportes y datos demo, pruebas de voluntarios, nacimientos y reportes |

Cada módulo se integró a `develop` por Pull Request con revisión cruzada (ver pestaña **Pull requests** del repositorio).

# Guía para la defensa

## Pitch de 30 segundos

En las playas del Pacífico, los voluntarios patrullan de noche y rescatan nidos de tortuga. Los huevos se llevan a un vivero hasta que nacen las crías. Ese proceso suele llevarse en papel, y eso provoca errores:
- dos nidos en el mismo corral,
- voluntarios en dos turnos a la vez,
- conteos de crías que no cuadran.

Nuestra API sigue todo el ciclo, **del patrullaje a la liberación**, y el sistema impide esos errores automáticamente.

## Demo sugerida (unos 7 minutos, con Postman)

1. **Login como coordinador.** Muestre el token y el rol que devuelve.
2. **Crear un turno y asignar un voluntario.** Luego asígnelo otra vez para mostrar el **409**.
3. **Registrar un nido.** Intente otro nido en el mismo sector para mostrar el **400** de la RN-08 (sector ocupado).
4. **Abrir "Nidos listos para eclosionar"**, registrar la eclosión y mostrar que el nido pasó solo a `ECLOSIONADO`.
5. **Liberar más crías de las nacidas** para mostrar el **400**. Después, liberar la cantidad correcta.
6. **Usar el token de consulta para borrar** algo y mostrar el **403**. Repetir sin token para mostrar el **401**.
7. **Abrir el reporte resumen por playa**, que muestra la tasa de eclosión calculada con el ORM.
8. **Ejecutar una prueba en vivo:**
   ```bash
   python manage.py test nacimientos
   ```

## Preguntas probables y cómo responderlas

**Explique el flujo solicitud → vista → serializador → ORM → respuesta con "registrar eclosión".**

1. `POST /api/eclosiones/` llega a `EclosionViewSet`.
2. Primero, `PermisoPorRol` revisa el rol del usuario.
3. Luego `EclosionSerializer.validate` llama a `services.validar_eclosion`, que aplica las reglas RN-11, RN-12 y RN-13.
4. Si todo es válido, `perform_create` llama a `registrar_eclosion`. Esa función guarda la eclosión y cambia el estado del nido dentro de una transacción (`transaction.atomic`).
5. El ORM ejecuta un INSERT y un UPDATE.
6. La API responde 201 con el JSON serializado.

**¿Dónde está la relación N:M?**

Turno ↔ Voluntario, a través del modelo `Asignacion`:
- Se usa un modelo intermedio para guardar el **rol** (líder o patrullero) de cada voluntario en el turno.
- Tiene una restricción única `(turno, voluntario)`.

**¿Por qué PROTECT y no CASCADE?**

Si se borrara una playa en cascada, se perderían los nidos y las liberaciones, que son evidencia de conservación. Con PROTECT, la API responde 409 y obliga a desactivar el registro en lugar de borrarlo.

**¿Cómo protegen las reglas en PATCH?**

En un PATCH solo llegan algunos campos. El serializador completa los campos que faltan con los valores actuales de la instancia, usando `getattr(self.instance, ...)`. Después valida igual que en una creación.

Ejemplo: en un nido ya eclosionado, un PATCH que cambie `huevos` responde 400.

**¿Qué hace `select_related` y qué hace `prefetch_related`?**

| | Para qué relaciones | Cómo trae los datos |
|---|---|---|
| `select_related` | FK y 1:1 | Hace un **JOIN**: una sola consulta |
| `prefetch_related` | N:M e inversas | Hace una **segunda consulta** y une los datos en Python |

Ejemplos en el proyecto:
- `select_related` se usa en "nidos próximos a eclosionar", para traer playa, sector y turno.
- `prefetch_related` se usa en el listado de turnos, para traer los voluntarios de cada turno.

**¿Diferencia entre 400 y 409?**

- **400:** los datos enviados son inválidos.
- **409:** los datos son válidos, pero chocan con el estado actual. Por ejemplo, el nido ya eclosionó o el voluntario ya estaba asignado.

**¿Diferencia entre 401 y 403?**

- **401:** no sabemos quién es el usuario (no envió token, o el token es inválido).
- **403:** sabemos quién es, pero su rol no tiene permiso para esa operación.

**¿Por qué las liberaciones no se editan?**

Por trazabilidad: es el dato que se reporta a SINAC. La justificación completa está en el documento técnico, sección 9.

**¿Cómo se define quién puede hacer qué?**

- La clase `PermisoPorRol` está en `core/permissions.py`.
- Cada vista declara qué roles tiene para cada operación con los atributos `roles_lectura`, `roles_escritura` y `roles_borrado`.

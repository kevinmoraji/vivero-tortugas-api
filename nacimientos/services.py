"""
Reglas y decisiones automáticas del módulo de nacimientos.
"""
from datetime import date, timedelta

from django.conf import settings
from django.db import transaction
from rest_framework.exceptions import ValidationError

from core.exceptions import Conflicto
from nidos.models import Nido

DIAS_MAXIMOS_PARA_LIBERAR = 2


def validar_eclosion(nido, fecha, vivas, muertas, sin_desarrollo, eclosion_actual=None):
    errores = {}

    # RN-13: solo un nido que está incubando puede eclosionar, y una sola vez.
    if eclosion_actual is None:
        if hasattr(nido, "eclosion"):
            raise Conflicto("Este nido ya tiene una eclosión registrada.")
        if nido.estado != Nido.INCUBANDO:
            raise ValidationError({"nido": "Solo se registra eclosión de nidos que están incubando."})

    # RN-11: periodo mínimo de incubación y fecha no futura.
    fecha_minima = nido.fecha_siembra + timedelta(days=settings.DIAS_MINIMOS_INCUBACION)
    if fecha > date.today():
        errores["fecha"] = "La fecha de eclosión no puede ser futura."
    elif fecha < fecha_minima:
        errores["fecha"] = (
            f"Una eclosión requiere al menos {settings.DIAS_MINIMOS_INCUBACION} días "
            f"de incubación (no antes de {fecha_minima:%Y-%m-%d})."
        )

    # RN-12: el conteo debe cuadrar con los huevos sembrados.
    total = vivas + muertas + sin_desarrollo
    if total != nido.huevos:
        errores["crias_vivas"] = (
            f"Vivas + muertas + sin desarrollo suman {total}, "
            f"pero el nido tiene {nido.huevos} huevos."
        )

    # Invariante en PATCH: no reducir vivas por debajo de lo ya liberado.
    if eclosion_actual is not None and vivas < eclosion_actual.crias_liberadas:
        errores["crias_vivas"] = (
            f"Ya se liberaron {eclosion_actual.crias_liberadas} crías; "
            "no se puede registrar un número menor de crías vivas."
        )

    if errores:
        raise ValidationError(errores)


@transaction.atomic
def registrar_eclosion(serializer):
    """Decisión automatizada: al registrar la eclosión el nido pasa a
    ECLOSIONADO y su sector del vivero queda libre para otro nido."""
    eclosion = serializer.save()
    nido = eclosion.nido
    nido.estado = Nido.ECLOSIONADO
    nido.save(update_fields=["estado"])
    return eclosion


@transaction.atomic
def anular_eclosion(eclosion):
    """Al borrar una eclosión (solo admin) el nido vuelve a INCUBANDO.
    Si ya hay liberaciones, el PROTECT lo impide (409)."""
    nido = eclosion.nido
    eclosion.delete()
    nido.estado = Nido.INCUBANDO
    nido.save(update_fields=["estado"])


def validar_liberacion(eclosion, responsable, fecha, cantidad):
    errores = {}

    # RN-14: no liberar más crías de las que nacieron vivas.
    pendientes = eclosion.crias_pendientes
    if cantidad < 1:
        errores["cantidad"] = "Debe liberarse al menos una cría."
    elif cantidad > pendientes:
        errores["cantidad"] = f"Solo quedan {pendientes} crías pendientes de liberar."

    # RN-15: liberar a tiempo (máx. 2 días después de nacer) y no en el futuro.
    if fecha > date.today():
        errores["fecha"] = "La fecha de liberación no puede ser futura."
    elif fecha < eclosion.fecha:
        errores["fecha"] = "No se puede liberar antes de la eclosión."
    elif fecha > eclosion.fecha + timedelta(days=DIAS_MAXIMOS_PARA_LIBERAR):
        errores["fecha"] = (
            f"Las crías deben liberarse dentro de los {DIAS_MAXIMOS_PARA_LIBERAR} días "
            "siguientes a la eclosión."
        )

    # RN-16: el responsable debe ser un voluntario activo.
    if not responsable.activo:
        errores["responsable"] = "El voluntario responsable está inactivo."

    if errores:
        raise ValidationError(errores)
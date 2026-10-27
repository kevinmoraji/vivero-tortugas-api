"""
Reglas de negocio de los patrullajes
"""
from datetime import timedelta
from rest_framework.exceptions import ValidationError
from core.exceptions import Conflicto
from .models import Asignacion

DURACION_MAXIMA = timedelta(hours=8)


def validar_horario(inicio, fin):
    """RN-02: el turno debe terminar después de empezar y durar como máximo 8 h."""
    if fin <= inicio:
        raise ValidationError({"fin": "La hora de fin debe ser posterior a la de inicio."})
    if fin - inicio > DURACION_MAXIMA:
        raise ValidationError({"fin": "Un turno no puede durar más de 8 horas."})


def turnos_traslapados(voluntario, inicio, fin, excluir_turno=None):
    """Turnos del voluntario que se cruzan con el intervalo [inicio, fin)."""
    turnos_que_se_cruzan = voluntario.turnos.filter(inicio__lt=fin, fin__gt=inicio)
    if excluir_turno is not None:
        turnos_que_se_cruzan = turnos_que_se_cruzan.exclude(pk=excluir_turno.pk)
    return turnos_que_se_cruzan


def asignar_voluntario(turno, voluntario, rol):
    """Agrega un voluntario a un turno aplicando RN-03, RN-04 y RN-05."""
    # RN-03 es solo voluntarios activos
    if not voluntario.activo:
        raise ValidationError({"voluntario": "El voluntario está inactivo."})

    # 409 es que ya estaba asignado a este turno
    if turno.asignaciones.filter(voluntario=voluntario).exists():
        raise Conflicto("El voluntario ya está asignado a este turno.")

    # RN-04 es que no superar el cupo del turno
    if turno.asignaciones.count() >= turno.cupo_maximo:
        raise ValidationError({"turno": "El turno ya alcanzó su cupo máximo de voluntarios."})

    # RN-05 es que un voluntario no puede estar en dos turnos al mismo tiempo
    if turnos_traslapados(voluntario, turno.inicio, turno.fin, excluir_turno=turno).exists():
        raise ValidationError(
            {"voluntario": "El voluntario ya tiene otro turno que se traslapa con este horario."}
        )

    return Asignacion.objects.create(turno=turno, voluntario=voluntario, rol=rol)


def validar_cambios_turno(turno, inicio, fin, cupo_maximo):
    """Invariantes que también se protegen en PUT/PATCH de un turno existente."""
    asignados = turno.asignaciones.count()
    if cupo_maximo < asignados:
        raise ValidationError(
            {"cupo_maximo": f"El turno ya tiene {asignados} voluntarios asignados."}
        )
    for asignacion in turno.asignaciones.select_related("voluntario"):
        if turnos_traslapados(asignacion.voluntario, inicio, fin, excluir_turno=turno).exists():
            raise ValidationError(
                {"inicio": f"El nuevo horario choca con otro turno de {asignacion.voluntario}."}
            )
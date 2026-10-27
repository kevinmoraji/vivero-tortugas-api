"""
Módulo 3 Patrullajes.
Turno:salida nocturna a la playa en un horario definido
Asignacion:tabla intermedia de la relación N:M Turno <-> Voluntario, tambien guarda el rol del voluntario en ese turno
"""
from django.db import models
from vivero.models import Playa
from voluntarios.models import Voluntario


class Turno(models.Model):
    playa = models.ForeignKey(Playa, on_delete=models.PROTECT, related_name="turnos")
    inicio = models.DateTimeField()
    fin = models.DateTimeField()
    cupo_maximo = models.PositiveSmallIntegerField(default=4)
    observaciones = models.TextField(blank=True)
    voluntarios = models.ManyToManyField(
        Voluntario, through="Asignacion", related_name="turnos"
    )

    class Meta:
        ordering = ["-inicio"]

    def __str__(self):
        return f"{self.playa.nombre} · {self.inicio:%Y-%m-%d %H:%M}"


class Asignacion(models.Model):
    LIDER = "LIDER"
    PATRULLERO = "PATRULLERO"
    ROLES = [(LIDER, "Líder de turno"), (PATRULLERO, "Patrullero")]

    turno = models.ForeignKey(Turno, on_delete=models.CASCADE, related_name="asignaciones")
    voluntario = models.ForeignKey(
        Voluntario, on_delete=models.PROTECT, related_name="asignaciones"
    )
    rol = models.CharField(max_length=12, choices=ROLES, default=PATRULLERO)
    asignado = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["turno", "voluntario"], name="voluntario_unico_por_turno"
            )
        ]

    def __str__(self):
        return f"{self.voluntario} en {self.turno}"
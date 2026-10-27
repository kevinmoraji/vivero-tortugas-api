"""
Módulo 5 — Nacimientos.

Eclosion:   resultado del nido cuando nacen las tortugas (1:1 con Nido).
Liberacion: cada salida de crías al mar (N:1 con Eclosion).
"""
from django.db import models
from django.db.models import Sum

from nidos.models import Nido
from voluntarios.models import Voluntario


class Eclosion(models.Model):
    # PROTECT: un nido con eclosión registrada no se puede borrar.
    nido = models.OneToOneField(Nido, on_delete=models.PROTECT, related_name="eclosion")
    fecha = models.DateField()
    crias_vivas = models.PositiveSmallIntegerField()
    crias_muertas = models.PositiveSmallIntegerField(default=0)
    huevos_sin_desarrollo = models.PositiveSmallIntegerField(default=0)
    observaciones = models.TextField(blank=True)
    creado = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-fecha"]
        verbose_name = "eclosión"
        verbose_name_plural = "eclosiones"

    def __str__(self):
        return f"Eclosión de {self.nido.codigo}"

    @property
    def tasa_eclosion(self):
        """Porcentaje de huevos que produjeron crías vivas."""
        return round(self.crias_vivas * 100 / self.nido.huevos, 1)

    @property
    def crias_liberadas(self):
        return self.liberaciones.aggregate(total=Sum("cantidad"))["total"] or 0

    @property
    def crias_pendientes(self):
        return self.crias_vivas - self.crias_liberadas


class Liberacion(models.Model):
    # PROTECT: las liberaciones son el registro final y no deben perderse.
    eclosion = models.ForeignKey(Eclosion, on_delete=models.PROTECT, related_name="liberaciones")
    responsable = models.ForeignKey(
        Voluntario, on_delete=models.PROTECT, related_name="liberaciones"
    )
    fecha = models.DateField()
    cantidad = models.PositiveSmallIntegerField()
    observaciones = models.TextField(blank=True)
    creado = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-fecha"]
        verbose_name = "liberación"
        verbose_name_plural = "liberaciones"

    def __str__(self):
        return f"{self.cantidad} crías de {self.eclosion.nido.codigo}"
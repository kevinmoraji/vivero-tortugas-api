"""
Módulo 1 — Vivero 
Playa:   donde se patrulla y donde está el vivero
Sector: cada espacio del vivero donde se reubica un nido
"""
from django.db import models


class Playa(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    provincia = models.CharField(max_length=50)
    canton = models.CharField(max_length=50, blank=True)
    descripcion = models.TextField(blank=True)
    activa = models.BooleanField(default=True)
    creado = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["nombre"]
        verbose_name = "playa"

    def __str__(self):
        return self.nombre


class Sector(models.Model):
    playa = models.ForeignKey(Playa, on_delete=models.CASCADE, related_name="sectores")
    codigo = models.CharField(max_length=10, help_text="Ej.: A-01")
    activo = models.BooleanField(default=True)

    class Meta:
        ordering = ["playa__nombre", "codigo"]
        verbose_name = "sector del vivero"
        verbose_name_plural = "sectores del vivero"
        constraints = [
            models.UniqueConstraint(
                fields=["playa", "codigo"], name="sector_codigo_unico_por_playa"
            )
        ]

    def __str__(self):
        return f"{self.playa.nombre} · {self.codigo}"

    @property
    def ocupado(self):
        if not hasattr(self, "nidos"):  # la app nidos aún no existe
            return False
        return self.nidos.filter(estado="INCUBANDO").exists()
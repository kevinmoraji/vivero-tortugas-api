"""
Módulo 2 — Voluntarios.
Personas que patrullan la playa en las noches de anidación.
"""
from django.db import models


class Voluntario(models.Model):
    cedula = models.CharField(max_length=20, unique=True)
    nombre = models.CharField(max_length=60)
    apellidos = models.CharField(max_length=80)
    email = models.EmailField(unique=True)
    telefono = models.CharField(max_length=20, blank=True)
    fecha_ingreso = models.DateField()
    activo = models.BooleanField(default=True)

    class Meta:
        ordering = ["apellidos", "nombre"]

    def __str__(self):
        return f"{self.nombre} {self.apellidos}"
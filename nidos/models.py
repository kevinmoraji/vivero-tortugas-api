"""
Módulo 4 — Nidos.

Un nido se encuentra durante un turno de patrullaje y sus huevos se
reubican en un sector del vivero, donde incuban hasta eclosionar.
"""
from django.db import models

from patrullajes.models import Turno
from vivero.models import Playa, Sector


class Nido(models.Model):
    LORA = "LORA"
    BAULA = "BAULA"
    VERDE = "VERDE"
    CAREY = "CAREY"
    ESPECIES = [
        (LORA, "Lora (Lepidochelys olivacea)"),
        (BAULA, "Baula (Dermochelys coriacea)"),
        (VERDE, "Verde (Chelonia mydas)"),
        (CAREY, "Carey (Eretmochelys imbricata)"),
    ]

    INCUBANDO = "INCUBANDO"
    ECLOSIONADO = "ECLOSIONADO"
    PERDIDO = "PERDIDO"
    ESTADOS = [
        (INCUBANDO, "Incubando"),
        (ECLOSIONADO, "Eclosionado"),
        (PERDIDO, "Perdido"),
    ]

    codigo = models.CharField(max_length=20, unique=True, help_text="Ej.: OST-2026-001")
    especie = models.CharField(max_length=10, choices=ESPECIES)
    playa = models.ForeignKey(Playa, on_delete=models.PROTECT, related_name="nidos")
    turno = models.ForeignKey(Turno, on_delete=models.PROTECT, related_name="nidos")
    sector = models.ForeignKey(Sector, on_delete=models.PROTECT, related_name="nidos")
    fecha_siembra = models.DateField()
    huevos = models.PositiveSmallIntegerField()
    estado = models.CharField(max_length=12, choices=ESTADOS, default=INCUBANDO)
    observaciones = models.TextField(blank=True)
    creado = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-fecha_siembra", "codigo"]
        constraints = [
           
            models.CheckConstraint(
                condition=models.Q(huevos__gte=1) & models.Q(huevos__lte=200),
                name="nido_huevos_entre_1_y_200",
            ),
        ]

    def __str__(self):
        return f"{self.codigo} ({self.get_especie_display()})"
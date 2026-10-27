import re
from datetime import date

from rest_framework import serializers

from .models import Voluntario


class VoluntarioSerializer(serializers.ModelSerializer):
    total_turnos = serializers.SerializerMethodField()

    class Meta:
        model = Voluntario
        fields = [
            "id", "cedula", "nombre", "apellidos", "email", "telefono",
            "fecha_ingreso", "activo", "total_turnos",
        ]

    def get_total_turnos(self, obj):
        if hasattr(obj, "num_turnos"):
            return obj.num_turnos
        if hasattr(obj, "asignaciones"):
            return obj.asignaciones.count()
        return 0

    def validate_cedula(self, valor):
        limpia = valor.replace("-", "").strip()
        if not re.fullmatch(r"\d{9}", limpia):
            raise serializers.ValidationError(
                "La cédula debe tener 9 dígitos, p. ej. 601230456."
            )
        return limpia

    def validate_fecha_ingreso(self, valor):
        if valor > date.today():
            raise serializers.ValidationError(
                "La fecha de ingreso no puede ser futura."
            )
        return valor
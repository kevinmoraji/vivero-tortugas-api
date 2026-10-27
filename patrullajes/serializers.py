from rest_framework import serializers
from voluntarios.models import Voluntario
from . import services
from .models import Asignacion, Turno


class AsignacionSerializer(serializers.ModelSerializer):
    voluntario_nombre = serializers.CharField(source="voluntario.__str__", read_only=True)

    class Meta:
        model = Asignacion
        fields = ["id", "voluntario", "voluntario_nombre", "rol", "asignado"]
        read_only_fields = ["asignado"]


class AsignarSerializer(serializers.Serializer):
    """Datos de entrada para POST /turnos/{id}/asignar/"""

    voluntario = serializers.PrimaryKeyRelatedField(queryset=Voluntario.objects.all())
    rol = serializers.ChoiceField(choices=Asignacion.ROLES, default=Asignacion.PATRULLERO)


class TurnoSerializer(serializers.ModelSerializer):
    playa_nombre = serializers.CharField(source="playa.nombre", read_only=True)
    asignaciones = AsignacionSerializer(many=True, read_only=True)
    cupo_disponible = serializers.SerializerMethodField()

    class Meta:
        model = Turno
        fields = [
            "id", "playa", "playa_nombre", "inicio", "fin", "cupo_maximo",
            "cupo_disponible", "observaciones", "asignaciones",
        ]

    def get_cupo_disponible(self, turno):
        return turno.cupo_maximo - len(turno.asignaciones.all())

    def validate_cupo_maximo(self, cupo_maximo):
        if not 1 <= cupo_maximo <= 10:
            raise serializers.ValidationError("El cupo debe estar entre 1 y 10 voluntarios.")
        return cupo_maximo

    def validate_playa(self, playa):
        if not playa.activa:
            raise serializers.ValidationError("No se pueden programar turnos en una playa inactiva.")
        return playa

    def validate(self, datos):
        # En PATCH puede venir solo un campo: se completa con lo que ya existe.
        inicio = datos.get("inicio", getattr(self.instance, "inicio", None))
        fin = datos.get("fin", getattr(self.instance, "fin", None))
        services.validar_horario(inicio, fin)

        if self.instance is not None:
            cupo_maximo = datos.get("cupo_maximo", self.instance.cupo_maximo)
            services.validar_cambios_turno(self.instance, inicio, fin, cupo_maximo)
        return datos
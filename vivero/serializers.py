from rest_framework import serializers

from .models import Playa, Sector


class SectorSerializer(serializers.ModelSerializer):
    playa_nombre = serializers.CharField(source="playa.nombre", read_only=True)
    ocupado = serializers.BooleanField(read_only=True)

    class Meta:
        model = Sector
        fields = ["id", "playa", "playa_nombre", "codigo", "activo", "ocupado"]

    def validate_codigo(self, valor):
        return valor.strip().upper()

    def validate(self, datos):
        if self.instance and self.instance.ocupado:
            if datos.get("activo") is False:
                raise serializers.ValidationError(
                    {"activo": "No se puede desactivar un sector con un nido incubando."}
                )
            if "playa" in datos and datos["playa"] != self.instance.playa:
                raise serializers.ValidationError(
                    {"playa": "No se puede cambiar de playa un sector con un nido incubando."}
                )
        return datos


class PlayaSerializer(serializers.ModelSerializer):
    total_sectores = serializers.IntegerField(source="sectores.count", read_only=True)

    class Meta:
        model = Playa
        fields = [
            "id", "nombre", "provincia", "canton", "descripcion",
            "activa", "total_sectores", "creado",
        ]
        read_only_fields = ["creado"]
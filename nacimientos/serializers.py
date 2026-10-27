from rest_framework import serializers

from . import services
from .models import Eclosion, Liberacion


class EclosionSerializer(serializers.ModelSerializer):
    nido_codigo = serializers.CharField(source="nido.codigo", read_only=True)
    huevos_sembrados = serializers.IntegerField(source="nido.huevos", read_only=True)
    tasa_eclosion = serializers.FloatField(read_only=True)
    crias_liberadas = serializers.IntegerField(read_only=True)
    crias_pendientes = serializers.IntegerField(read_only=True)

    class Meta:
        model = Eclosion
        fields = [
            "id", "nido", "nido_codigo", "fecha", "huevos_sembrados",
            "crias_vivas", "crias_muertas", "huevos_sin_desarrollo",
            "tasa_eclosion", "crias_liberadas", "crias_pendientes",
            "observaciones", "creado",
        ]
        read_only_fields = ["creado"]
        # La unicidad del nido la valida el servicio para responder 409.
        extra_kwargs = {"nido": {"validators": []}}

    def validate(self, datos):
        actual = self.instance
        nido = datos.get("nido", getattr(actual, "nido", None))

        # Invariante: una eclosión no se puede mover a otro nido.
        if actual is not None and nido != actual.nido:
            raise serializers.ValidationError({"nido": "No se puede cambiar el nido de una eclosión."})

        def valor_del_campo(campo, valor_por_defecto=0):
            # En PATCH, si el campo no viene, se usa el valor que ya tenía.
            return datos.get(campo, getattr(actual, campo, valor_por_defecto))

        services.validar_eclosion(
            nido=nido,
            fecha=valor_del_campo("fecha", None),
            vivas=valor_del_campo("crias_vivas"),
            muertas=valor_del_campo("crias_muertas"),
            sin_desarrollo=valor_del_campo("huevos_sin_desarrollo"),
            eclosion_actual=actual,
        )
        return datos


class LiberacionSerializer(serializers.ModelSerializer):
    nido_codigo = serializers.CharField(source="eclosion.nido.codigo", read_only=True)
    responsable_nombre = serializers.CharField(source="responsable.__str__", read_only=True)

    class Meta:
        model = Liberacion
        fields = [
            "id", "eclosion", "nido_codigo", "responsable", "responsable_nombre",
            "fecha", "cantidad", "observaciones", "creado",
        ]
        read_only_fields = ["creado"]

    def validate(self, datos):
        services.validar_liberacion(
            eclosion=datos["eclosion"],
            responsable=datos["responsable"],
            fecha=datos["fecha"],
            cantidad=datos["cantidad"],
        )
        return datos
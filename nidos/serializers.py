from datetime import date

from django.utils import timezone
from rest_framework import serializers

from .models import Nido

CAMPOS_BLOQUEADOS_AL_CERRAR = ("huevos", "sector", "playa", "fecha_siembra", "turno", "especie")


class NidoSerializer(serializers.ModelSerializer):
    playa_nombre = serializers.CharField(source="playa.nombre", read_only=True)
    sector_codigo = serializers.CharField(source="sector.codigo", read_only=True)
    especie_nombre = serializers.CharField(source="get_especie_display", read_only=True)
    dias_incubacion = serializers.SerializerMethodField()

    class Meta:
        model = Nido
        fields = [
            "id", "codigo", "especie", "especie_nombre", "playa", "playa_nombre",
            "turno", "sector", "sector_codigo", "fecha_siembra", "dias_incubacion",
            "huevos", "estado", "observaciones", "creado",
        ]
        read_only_fields = ["estado", "creado"]

    def get_dias_incubacion(self, nido):
        return (date.today() - nido.fecha_siembra).days

    def validate_huevos(self, huevos):
        if not 1 <= huevos <= 200:
            raise serializers.ValidationError("Un nido debe tener entre 1 y 200 huevos.")
        return huevos

    def validate_codigo(self, codigo):
        return codigo.strip().upper()

    def validate(self, datos):
        nido = self.instance

        if nido is not None and nido.estado != Nido.INCUBANDO:
            campos_cambiados = [
                campo for campo in CAMPOS_BLOQUEADOS_AL_CERRAR
                if campo in datos and datos[campo] != getattr(nido, campo)
            ]
            if campos_cambiados:
                raise serializers.ValidationError(
                    {
                        campo: "No se puede modificar: el nido ya está cerrado."
                        for campo in campos_cambiados
                    }
                )
            return datos

        # En PATCH se completan los valores faltantes con los actuales.
        playa = datos.get("playa", getattr(nido, "playa", None))
        turno = datos.get("turno", getattr(nido, "turno", None))
        sector = datos.get("sector", getattr(nido, "sector", None))
        fecha = datos.get("fecha_siembra", getattr(nido, "fecha_siembra", None))

        errores = {}

        if turno.playa_id != playa.id:
            errores["turno"] = "El turno pertenece a otra playa."
        if sector.playa_id != playa.id:
            errores["sector"] = "El sector pertenece al vivero de otra playa."

        if "sector" in datos or nido is None:
            if not sector.activo:
                errores["sector"] = "El sector está inactivo."
            else:
                nidos_incubando_en_sector = sector.nidos.filter(estado=Nido.INCUBANDO)
                if nido is not None:
                    nidos_incubando_en_sector = nidos_incubando_en_sector.exclude(pk=nido.pk)
                if nidos_incubando_en_sector.exists():
                    errores["sector"] = "El sector ya tiene un nido incubando."

       
        if fecha > date.today():
            errores["fecha_siembra"] = "La fecha de siembra no puede ser futura."
        else:
            fechas_del_turno = {
                timezone.localtime(turno.inicio).date(),
                timezone.localtime(turno.fin).date(),
            }
            if fecha not in fechas_del_turno:
                errores["fecha_siembra"] = "La fecha de siembra debe coincidir con la noche del turno."

        if errores:
            raise serializers.ValidationError(errores)
        return datos


class NidoDetalleSerializer(NidoSerializer):
    """Detalle con el turno y los voluntarios que encontraron el nido."""

    voluntarios_del_turno = serializers.SerializerMethodField()
    eclosion = serializers.SerializerMethodField()

    class Meta(NidoSerializer.Meta):
        fields = NidoSerializer.Meta.fields + ["voluntarios_del_turno", "eclosion"]

    def get_voluntarios_del_turno(self, nido):
        return [str(asignacion.voluntario) for asignacion in nido.turno.asignaciones.all()]

    def get_eclosion(self, nido):
        # Mientras no exista la app nacimientos, el nido no tiene eclosion.
        eclosion = getattr(nido, "eclosion", None)
        if eclosion is None:
            return None
        return {"id": eclosion.id, "fecha": eclosion.fecha, "crias_vivas": eclosion.crias_vivas}
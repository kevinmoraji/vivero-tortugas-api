from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from core.exceptions import Conflicto

from .filters import NidoFilter
from .models import Nido
from .serializers import NidoDetalleSerializer, NidoSerializer


class NidoViewSet(viewsets.ModelViewSet):
    """
    CRUD de nidos.
    Filtros:      playa, especie, estado, sector, desde, hasta, min_huevos, voluntario
    Búsqueda:     ?search=OST-2026
    Ordenamiento: ?ordering=-huevos o ?ordering=fecha_siembra
    """

    queryset = Nido.objects.select_related("playa", "sector", "turno").distinct()
    filterset_class = NidoFilter
    search_fields = ["codigo", "observaciones"]
    ordering_fields = ["fecha_siembra", "huevos", "codigo"]

    def get_queryset(self):
        nidos = super().get_queryset()
        if self.action == "retrieve":
            # prefetch_related trae los voluntarios del turno en una sola consulta extra
            nidos = nidos.prefetch_related("turno__asignaciones__voluntario")
        return nidos

    def get_serializer_class(self):
        return NidoDetalleSerializer if self.action == "retrieve" else NidoSerializer

    @action(detail=True, methods=["post"], url_path="marcar-perdido")
    def marcar_perdido(self, request, pk=None):
        
        nido = self.get_object()
        if nido.estado != Nido.INCUBANDO:
            raise Conflicto("Solo se puede marcar como perdido un nido que está incubando.")
        motivo = request.data.get("motivo", "").strip()
        nido.estado = Nido.PERDIDO
        if motivo:
            nido.observaciones = f"{nido.observaciones}\nPerdido: {motivo}".strip()
        nido.save(update_fields=["estado", "observaciones"])
        return Response(NidoSerializer(nido).data)
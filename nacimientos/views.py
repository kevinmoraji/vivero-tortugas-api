from rest_framework import mixins, viewsets

from . import services
from .models import Eclosion, Liberacion
from .serializers import EclosionSerializer, LiberacionSerializer


class EclosionViewSet(viewsets.ModelViewSet):
    """CRUD de eclosiones. Al crear una, el nido se cierra automáticamente."""

    queryset = Eclosion.objects.select_related("nido", "nido__playa")
    serializer_class = EclosionSerializer
    filterset_fields = {"nido__playa": ["exact"], "fecha": ["gte", "lte"]}
    ordering_fields = ["fecha", "crias_vivas"]

    def perform_create(self, serializer):
        services.registrar_eclosion(serializer)

    def perform_destroy(self, instance):
        services.anular_eclosion(instance)


class LiberacionViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    """
    Liberaciones: solo crear, listar y consultar.

    Justificación (RF-02): una liberación es el registro final de crías que
    llegaron al mar y se reporta a SINAC; por trazabilidad no se edita ni se
    borra. Un error se corrige anulando la eclosión (admin) antes de liberar.
    """

    queryset = Liberacion.objects.select_related("eclosion__nido", "responsable")
    serializer_class = LiberacionSerializer
    filterset_fields = ["eclosion", "responsable", "eclosion__nido__playa"]
    ordering_fields = ["fecha", "cantidad"]
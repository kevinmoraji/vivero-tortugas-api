from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from core import roles

from . import services
from .filters import TurnoFilter
from .models import Turno
from .serializers import AsignacionSerializer, AsignarSerializer, TurnoSerializer


class TurnoViewSet(viewsets.ModelViewSet):
    """
    CRUD de turnos de patrullaje + acciones para asignar o retirar voluntarios
    """

    queryset = (
        Turno.objects.select_related("playa")
        .prefetch_related("asignaciones__voluntario")
        .distinct()
        .order_by("-inicio")  
    )
    serializer_class = TurnoSerializer
    filterset_class = TurnoFilter
    ordering_fields = ["inicio", "cupo_maximo"]

    @action(detail=True, methods=["post"])
    def asignar(self, request, pk=None):
        """POST /api/turnos/{id}/asignar/  {"voluntario": 3, "rol": "LIDER"}"""
        turno = self.get_object()
        datos_entrada = AsignarSerializer(data=request.data)
        datos_entrada.is_valid(raise_exception=True)
        asignacion = services.asignar_voluntario(
            turno, datos_entrada.validated_data["voluntario"], datos_entrada.validated_data["rol"]
        )
        return Response(AsignacionSerializer(asignacion).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["delete"], url_path=r"asignaciones/(?P<voluntario_id>\d+)")
    def retirar(self, request, pk=None, voluntario_id=None):
        """DELETE /api/turnos/{id}/asignaciones/{voluntario_id}/"""
        turno = self.get_object()
        asignacion = get_object_or_404(turno.asignaciones, voluntario_id=voluntario_id)
        asignacion.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def get_permissions(self):
        if self.action == "retirar":
            self.roles_borrado = (roles.ADMINISTRADOR, roles.COORDINADOR)
        return super().get_permissions()
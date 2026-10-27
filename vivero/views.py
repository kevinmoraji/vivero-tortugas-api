from rest_framework import viewsets

from core import roles

from .models import Playa, Sector
from .serializers import PlayaSerializer, SectorSerializer


class PlayaViewSet(viewsets.ModelViewSet):

    queryset = Playa.objects.prefetch_related("sectores")
    serializer_class = PlayaSerializer
    roles_escritura = (roles.ADMINISTRADOR,)
    filterset_fields = ["provincia", "activa"]
    search_fields = ["nombre", "canton"]
    ordering_fields = ["nombre", "creado"]


class SectorViewSet(viewsets.ModelViewSet):

    queryset = Sector.objects.select_related("playa")
    serializer_class = SectorSerializer
    roles_escritura = (roles.ADMINISTRADOR,)
    filterset_fields = ["playa", "activo"]
    ordering_fields = ["codigo"]
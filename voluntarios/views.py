from rest_framework import viewsets

from .models import Voluntario
from .serializers import VoluntarioSerializer


class VoluntarioViewSet(viewsets.ModelViewSet):
    """
    CRUD de voluntarios.
    Búsqueda:      ?search=ana
    Filtro:        ?activo=true
    Ordenamiento:  ?ordering=apellidos
    """

    queryset = Voluntario.objects.order_by("apellidos", "nombre")
    serializer_class = VoluntarioSerializer
    filterset_fields = ["activo"]
    search_fields = ["nombre", "apellidos", "cedula", "email"]
    ordering_fields = ["apellidos", "fecha_ingreso"]

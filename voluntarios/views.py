from django.db.models import Count
from rest_framework import viewsets

from .models import Voluntario
from .serializers import VoluntarioSerializer


class VoluntarioViewSet(viewsets.ModelViewSet):
    """
    CRUD de voluntarios.
    Búsqueda:      ?search=(nombre, apellidos, cédula, email)
    Filtro:        ?activo=true
    Ordenamiento:  ?ordering=-num_turnos
    """

    queryset = Voluntario.objects.annotate(num_turnos=Count("asignaciones")).order_by(
        "apellidos", "nombre"
    )
    serializer_class = VoluntarioSerializer
    filterset_fields = ["activo"]
    search_fields = ["nombre", "apellidos", "cedula", "email"]
    ordering_fields = ["apellidos", "fecha_ingreso", "num_turnos"]
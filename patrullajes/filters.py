from datetime import datetime, time, timedelta

import django_filters
from django.db.models import Count, F
from django.utils import timezone

from .models import Turno


class TurnoFilter(django_filters.FilterSet):
    """
    Filtros combinables:
    """

    desde = django_filters.DateFilter(method="filtrar_desde")
    hasta = django_filters.DateFilter(method="filtrar_hasta")
    voluntario = django_filters.NumberFilter(field_name="asignaciones__voluntario")
    con_cupo = django_filters.BooleanFilter(method="filtrar_con_cupo")

    class Meta:
        model = Turno
        fields = ["playa", "desde", "hasta", "voluntario", "con_cupo"]

    @staticmethod
    def inicio_del_dia(fecha):
        return timezone.make_aware(datetime.combine(fecha, time.min))

    def filtrar_desde(self, queryset, nombre_filtro, fecha):
        return queryset.filter(inicio__gte=self.inicio_del_dia(fecha))

    def filtrar_hasta(self, queryset, nombre_filtro, fecha):
        return queryset.filter(inicio__lt=self.inicio_del_dia(fecha + timedelta(days=1)))

    def filtrar_con_cupo(self, queryset, nombre_filtro, quiere_con_cupo):
        turnos = queryset.annotate(cantidad_asignados=Count("asignaciones", distinct=True))
        if quiere_con_cupo:
            return turnos.filter(cantidad_asignados__lt=F("cupo_maximo"))
        return turnos.filter(cantidad_asignados__gte=F("cupo_maximo"))
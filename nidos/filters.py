import django_filters

from .models import Nido


class NidoFilter(django_filters.FilterSet):
 

    desde = django_filters.DateFilter(field_name="fecha_siembra", lookup_expr="gte")
    hasta = django_filters.DateFilter(field_name="fecha_siembra", lookup_expr="lte")
    min_huevos = django_filters.NumberFilter(field_name="huevos", lookup_expr="gte")
    voluntario = django_filters.NumberFilter(field_name="turno__asignaciones__voluntario")

    class Meta:
        model = Nido
        fields = ["playa", "especie", "estado", "sector", "desde", "hasta", "min_huevos", "voluntario"]
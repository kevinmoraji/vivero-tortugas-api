"""
Consultas ORM no triviales (RF-04).

Cada función devuelve datos listos para la respuesta JSON. Están separadas
de las vistas para que se puedan explicar una por una en la defensa.
"""
from datetime import date, timedelta

from django.conf import settings
from django.db.models import Count, Exists, F, OuterRef, Prefetch, Q, Sum
from django.db.models.functions import TruncMonth

from nacimientos.models import Liberacion
from nidos.models import Nido
from vivero.models import Playa, Sector
from voluntarios.models import Voluntario


def resumen_por_playa():
    """C1 — Agregación: nidos, huevos, crías vivas y tasa de eclosión por playa."""
    playas = Playa.objects.annotate(
        total_nidos=Count("nidos", distinct=True),
        nidos_incubando=Count("nidos", filter=Q(nidos__estado=Nido.INCUBANDO), distinct=True),
        huevos_eclosionados=Sum("nidos__huevos", filter=Q(nidos__estado=Nido.ECLOSIONADO)),
        crias_vivas=Sum("nidos__eclosion__crias_vivas"),
    ).order_by("nombre")

    resultado = []
    for playa in playas:
        huevos = playa.huevos_eclosionados or 0
        vivas = playa.crias_vivas or 0
        resultado.append({
            "playa": playa.nombre,
            "total_nidos": playa.total_nidos,
            "nidos_incubando": playa.nidos_incubando,
            "crias_vivas": vivas,
            "tasa_eclosion": round(vivas * 100 / huevos, 1) if huevos else None,
        })
    return resultado


def nidos_por_especie(playa_id=None):
    """C2 — Agrupación (GROUP BY) por especie y estado, con filtro opcional."""
    nidos = Nido.objects.all()
    if playa_id:
        nidos = nidos.filter(playa_id=playa_id)
    return list(
        nidos.values("especie", "estado")
        .annotate(cantidad=Count("id"), huevos=Sum("huevos"))
        .order_by("especie", "estado")
    )


def ranking_voluntarios(limite=5):
    """C3 — Filtro por relaciones: voluntarios activos con más turnos y
    cuántos nidos se encontraron en sus turnos."""
    return list(
        Voluntario.objects.filter(activo=True)
        .annotate(
            total_turnos=Count("asignaciones", distinct=True),
            nidos_encontrados=Count("turnos__nidos", distinct=True),
        )
        .filter(total_turnos__gt=0)
        .order_by("-nidos_encontrados", "-total_turnos")
        .values("id", "nombre", "apellidos", "total_turnos", "nidos_encontrados")[:limite]
    )


def nidos_proximos_a_eclosionar():
    """C4 — select_related: nidos incubando que ya cumplieron el mínimo
    de días; trae playa, sector y turno en una sola consulta (JOIN)."""
    fecha_limite = date.today() - timedelta(days=settings.DIAS_MINIMOS_INCUBACION)
    nidos = (
        Nido.objects.select_related("playa", "sector", "turno")
        .filter(estado=Nido.INCUBANDO, fecha_siembra__lte=fecha_limite)
        .order_by("fecha_siembra")
    )
    return [
        {
            "id": nido.id,
            "codigo": nido.codigo,
            "especie": nido.get_especie_display(),
            "playa": nido.playa.nombre,
            "sector": nido.sector.codigo,
            "huevos": nido.huevos,
            "fecha_siembra": nido.fecha_siembra,
            "dias_incubacion": (date.today() - nido.fecha_siembra).days,
        }
        for nido in nidos
    ]


def ocupacion_vivero():
    """C5 — Subconsulta con Exists + prefetch_related: sectores libres y
    ocupados por playa."""
    nidos_incubando = Nido.objects.filter(sector=OuterRef("pk"), estado=Nido.INCUBANDO)
    sectores = Sector.objects.filter(activo=True).annotate(con_nido=Exists(nidos_incubando))
    playas = Playa.objects.filter(activa=True).prefetch_related(
        Prefetch("sectores", queryset=sectores, to_attr="sectores_activos")
    )
    resultado = []
    for playa in playas:
        ocupados = [sector.codigo for sector in playa.sectores_activos if sector.con_nido]
        libres = [sector.codigo for sector in playa.sectores_activos if not sector.con_nido]
        total_sectores = len(playa.sectores_activos)
        resultado.append({
            "playa": playa.nombre,
            "ocupados": ocupados,
            "libres": libres,
            "porcentaje_ocupacion": round(len(ocupados) * 100 / total_sectores, 1)
            if total_sectores else 0,
        })
    return resultado


def liberaciones_por_mes(anio=None):
    """C6 — Agregación por mes (TruncMonth) de crías liberadas al mar."""
    liberaciones = Liberacion.objects.all()
    if anio:
        liberaciones = liberaciones.filter(fecha__year=anio)
    filas_por_mes = (
        liberaciones.annotate(mes=TruncMonth("fecha"))
        .values("mes")
        .annotate(total_liberaciones=Count("id"), crias=Sum("cantidad"))
        .order_by("mes")
    )
    return [
        {
            "mes": fila["mes"].strftime("%Y-%m"),
            "liberaciones": fila["total_liberaciones"],
            "crias": fila["crias"],
        }
        for fila in filas_por_mes
    ]


def nidos_con_baja_eclosion(umbral=60):
    """C7 — Expresión F(): nidos cuya tasa de eclosión quedó bajo el umbral (%)."""
    return list(
        Nido.objects.filter(estado=Nido.ECLOSIONADO)
        .filter(eclosion__crias_vivas__lt=F("huevos") * umbral / 100)
        .values("codigo", "especie", "huevos", "eclosion__crias_vivas", "playa__nombre")
        .order_by("playa__nombre", "codigo")
    )
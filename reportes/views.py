"""
Reportes de solo lectura. Los pueden consultar los tres roles.
"""
from rest_framework.response import Response
from rest_framework.views import APIView

from . import consultas


class ResumenPlayasView(APIView):
    def get(self, request):
        return Response(consultas.resumen_por_playa())


class NidosPorEspecieView(APIView):
    def get(self, request):
        return Response(consultas.nidos_por_especie(request.query_params.get("playa")))


class RankingVoluntariosView(APIView):
    def get(self, request):
        return Response(consultas.ranking_voluntarios())


class ProximosEclosionarView(APIView):
    def get(self, request):
        return Response(consultas.nidos_proximos_a_eclosionar())


class OcupacionViveroView(APIView):
    def get(self, request):
        return Response(consultas.ocupacion_vivero())


class LiberacionesPorMesView(APIView):
    def get(self, request):
        return Response(consultas.liberaciones_por_mes(request.query_params.get("anio")))


class BajaEclosionView(APIView):
    def get(self, request):
        try:
            umbral = int(request.query_params.get("umbral", 60))
        except ValueError:
            return Response({"umbral": "Debe ser un número entero."}, status=400)
        return Response(consultas.nidos_con_baja_eclosion(umbral))
from datetime import timedelta

from core.pruebas_base import PruebaBase
from nacimientos.models import Eclosion
from nidos.models import Nido


class ReportesTests(PruebaBase):
    def test_resumen_por_playa_calcula_tasa(self):
        Eclosion.objects.create(nido=self.nido_listo, fecha=self.hoy - timedelta(days=2),
                                crias_vivas=75, crias_muertas=5, huevos_sin_desarrollo=20)
        Nido.objects.filter(pk=self.nido_listo.pk).update(estado=Nido.ECLOSIONADO)
        self.como("consulta")
        respuesta = self.client.get("/api/reportes/resumen-playas/")
        self.assertEqual(respuesta.status_code, 200)
        ostional = next(fila for fila in respuesta.data if fila["playa"] == "Playa Ostional")
        self.assertEqual(ostional["tasa_eclosion"], 75.0)

    def test_proximos_a_eclosionar(self):
        self.como("consulta")
        respuesta = self.client.get("/api/reportes/proximos-a-eclosionar/")
        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(respuesta.data[0]["codigo"], "OST-2026-001")

    def test_ocupacion_del_vivero(self):
        self.como("consulta")
        respuesta = self.client.get("/api/reportes/ocupacion-vivero/")
        ostional = next(fila for fila in respuesta.data if fila["playa"] == "Playa Ostional")
        self.assertEqual(ostional["ocupados"], ["A-01"])
        self.assertEqual(ostional["porcentaje_ocupacion"], 50.0)

    def test_ranking_de_voluntarios(self):
        self.como("consulta")
        respuesta = self.client.get("/api/reportes/ranking-voluntarios/")
        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(respuesta.data[0]["nombre"], "Ana")
        self.assertEqual(respuesta.data[0]["nidos_encontrados"], 1)
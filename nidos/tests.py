from datetime import timedelta

from core.pruebas_base import PruebaBase
from nidos.models import Nido


class NidoTests(PruebaBase):
    def datos(self, **cambios):
        base = {
            "codigo": "ost-2026-002", "especie": "LORA", "playa": self.playa.id,
            "turno": self.turno_reciente.id, "sector": self.sector2.id,
            "fecha_siembra": str(self.anoche), "huevos": 95,
        }
        base.update(cambios)
        return base

    def test_crear_nido_responde_201(self):
        self.como("coordinador")
        respuesta = self.client.post("/api/nidos/", self.datos())
        self.assertEqual(respuesta.status_code, 201)
        self.assertEqual(respuesta.data["codigo"], "OST-2026-002")
        self.assertEqual(respuesta.data["estado"], "INCUBANDO")

    def test_sector_ocupado_responde_400(self):
        self.como("coordinador")
        respuesta = self.client.post("/api/nidos/", self.datos(sector=self.sector1.id))
        self.assertEqual(respuesta.status_code, 400)
        self.assertIn("sector", respuesta.data)

    def test_sector_de_otra_playa_responde_400(self):
        self.como("coordinador")
        respuesta = self.client.post("/api/nidos/", self.datos(sector=self.sector_otra.id))
        self.assertEqual(respuesta.status_code, 400)

    def test_huevos_fuera_de_rango_responde_400(self):
        self.como("coordinador")
        respuesta = self.client.post("/api/nidos/", self.datos(huevos=250))
        self.assertEqual(respuesta.status_code, 400)

    def test_fecha_distinta_a_la_del_turno_responde_400(self):
        self.como("coordinador")
        respuesta = self.client.post("/api/nidos/", self.datos(fecha_siembra=str(self.hoy - timedelta(days=10))))
        self.assertEqual(respuesta.status_code, 400)
        self.assertIn("fecha_siembra", respuesta.data)

    def test_patch_no_modifica_nido_cerrado(self):
        Nido.objects.filter(pk=self.nido_listo.pk).update(estado=Nido.ECLOSIONADO)
        self.como("coordinador")
        respuesta = self.client.patch(f"/api/nidos/{self.nido_listo.id}/", {"huevos": 120}, format="json")
        self.assertEqual(respuesta.status_code, 400)
        # Las observaciones sí se pueden corregir
        respuesta = self.client.patch(f"/api/nidos/{self.nido_listo.id}/", {"observaciones": "ok"}, format="json")
        self.assertEqual(respuesta.status_code, 200)

    def test_estado_no_se_edita_manualmente(self):
        self.como("coordinador")
        respuesta = self.client.patch(f"/api/nidos/{self.nido_listo.id}/", {"estado": "ECLOSIONADO"}, format="json")
        self.assertEqual(respuesta.status_code, 200)
        self.nido_listo.refresh_from_db()
        self.assertEqual(self.nido_listo.estado, Nido.INCUBANDO)

    def test_filtros_combinables_y_ordenamiento(self):
        self.como("coordinador")
        self.client.post("/api/nidos/", self.datos(especie="VERDE", huevos=80))
        respuesta = self.client.get(f"/api/nidos/?playa={self.playa.id}&especie=LORA&estado=INCUBANDO")
        self.assertEqual(respuesta.data["count"], 1)
        respuesta = self.client.get("/api/nidos/?ordering=huevos")
        self.assertEqual([nido["huevos"] for nido in respuesta.data["results"]], [80, 100])

    def test_detalle_incluye_voluntarios_del_turno(self):
        self.como("consulta")
        respuesta = self.client.get(f"/api/nidos/{self.nido_listo.id}/")
        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(respuesta.data["voluntarios_del_turno"], ["Ana Solano"])

    def test_nido_inexistente_responde_404(self):
        self.como("consulta")
        respuesta = self.client.get("/api/nidos/99999/")
        self.assertEqual(respuesta.status_code, 404)

    def test_marcar_perdido_libera_el_sector(self):
        self.como("coordinador")
        respuesta = self.client.post(f"/api/nidos/{self.nido_listo.id}/marcar-perdido/", {"motivo": "Marea alta"})
        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(respuesta.data["estado"], "PERDIDO")
        respuesta = self.client.post("/api/nidos/", self.datos(sector=self.sector1.id))
        self.assertEqual(respuesta.status_code, 201)
        respuesta = self.client.post(f"/api/nidos/{self.nido_listo.id}/marcar-perdido/")
        self.assertEqual(respuesta.status_code, 409)
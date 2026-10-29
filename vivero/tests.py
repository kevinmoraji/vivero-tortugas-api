from core.pruebas_base import PruebaBase
from vivero.models import Playa


class PlayaCrudTests(PruebaBase):
    def test_crud_completo_de_playa(self):
        self.como("admin")
        respuesta = self.client.post("/api/playas/", {"nombre": "Playa Caletas", "provincia": "Puntarenas"})
        self.assertEqual(respuesta.status_code, 201)
        playa_id = respuesta.data["id"]

        respuesta = self.client.get(f"/api/playas/{playa_id}/")
        self.assertEqual(respuesta.status_code, 200)

        respuesta = self.client.patch(f"/api/playas/{playa_id}/", {"canton": "Puntarenas"}, format="json")
        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(respuesta.data["canton"], "Puntarenas")

        respuesta = self.client.delete(f"/api/playas/{playa_id}/")
        self.assertEqual(respuesta.status_code, 204)
        self.assertFalse(Playa.objects.filter(pk=playa_id).exists())

    def test_nombre_de_playa_duplicado_responde_400(self):
        self.como("admin")
        respuesta = self.client.post("/api/playas/", {"nombre": "Playa Ostional", "provincia": "Guanacaste"})
        self.assertEqual(respuesta.status_code, 400)

    def test_borrar_playa_con_nidos_responde_409(self):
        self.como("admin")
        respuesta = self.client.delete(f"/api/playas/{self.playa.id}/")
        self.assertEqual(respuesta.status_code, 409)

    def test_coordinador_no_modifica_catalogo_responde_403(self):
        self.como("coordinador")
        respuesta = self.client.post("/api/playas/", {"nombre": "Playa Nueva", "provincia": "Limón"})
        self.assertEqual(respuesta.status_code, 403)

    def test_patch_no_desactiva_sector_ocupado(self):
        self.como("admin")
        respuesta = self.client.patch(f"/api/sectores/{self.sector1.id}/", {"activo": False}, format="json")
        self.assertEqual(respuesta.status_code, 400)
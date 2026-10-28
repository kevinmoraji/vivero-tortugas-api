from datetime import timedelta

from core.pruebas_base import PruebaBase
from nacimientos.models import Eclosion, Liberacion
from nidos.models import Nido


class EclosionTests(PruebaBase):
    def datos(self, **cambios):
        base = {
            "nido": self.nido_listo.id, "fecha": str(self.hoy - timedelta(days=5)),
            "crias_vivas": 80, "crias_muertas": 5, "huevos_sin_desarrollo": 15,
        }
        base.update(cambios)
        return base

    def test_registrar_eclosion_cierra_el_nido(self):
        self.como("coordinador")
        respuesta = self.client.post("/api/eclosiones/", self.datos())
        self.assertEqual(respuesta.status_code, 201)
        self.assertEqual(respuesta.data["tasa_eclosion"], 80.0)
        self.nido_listo.refresh_from_db()
        self.assertEqual(self.nido_listo.estado, Nido.ECLOSIONADO)

    def test_eclosion_antes_de_45_dias_responde_400(self):
        self.como("coordinador")
        respuesta = self.client.post("/api/eclosiones/", self.datos(fecha=str(self.noche_antigua + timedelta(days=20))))
        self.assertEqual(respuesta.status_code, 400)
        self.assertIn("fecha", respuesta.data)

    def test_conteo_que_no_cuadra_responde_400(self):
        self.como("coordinador")
        respuesta = self.client.post("/api/eclosiones/", self.datos(crias_vivas=120))
        self.assertEqual(respuesta.status_code, 400)
        self.assertIn("crias_vivas", respuesta.data)

    def test_segunda_eclosion_del_mismo_nido_responde_409(self):
        self.como("coordinador")
        self.client.post("/api/eclosiones/", self.datos())
        respuesta = self.client.post("/api/eclosiones/", self.datos())
        self.assertEqual(respuesta.status_code, 409)


class LiberacionTests(PruebaBase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.eclosion = Eclosion.objects.create(
            nido=cls.nido_listo, fecha=cls.hoy - timedelta(days=1),
            crias_vivas=80, crias_muertas=5, huevos_sin_desarrollo=15,
        )
        Nido.objects.filter(pk=cls.nido_listo.pk).update(estado=Nido.ECLOSIONADO)

    def test_liberar_crias_responde_201(self):
        self.como("coordinador")
        respuesta = self.client.post("/api/liberaciones/", {
            "eclosion": self.eclosion.id, "responsable": self.ana.id,
            "fecha": str(self.hoy), "cantidad": 50,
        })
        self.assertEqual(respuesta.status_code, 201)
        respuesta = self.client.get(f"/api/eclosiones/{self.eclosion.id}/")
        self.assertEqual(respuesta.data["crias_pendientes"], 30)

    def test_no_libera_mas_crias_de_las_vivas(self):
        Liberacion.objects.create(eclosion=self.eclosion, responsable=self.ana, fecha=self.hoy, cantidad=60)
        self.como("coordinador")
        respuesta = self.client.post("/api/liberaciones/", {
            "eclosion": self.eclosion.id, "responsable": self.ana.id,
            "fecha": str(self.hoy), "cantidad": 30,
        })
        self.assertEqual(respuesta.status_code, 400)
        self.assertIn("cantidad", respuesta.data)

    def test_responsable_inactivo_responde_400(self):
        self.como("coordinador")
        respuesta = self.client.post("/api/liberaciones/", {
            "eclosion": self.eclosion.id, "responsable": self.inactivo.id,
            "fecha": str(self.hoy), "cantidad": 10,
        })
        self.assertEqual(respuesta.status_code, 400)

    def test_liberacion_no_se_edita_responde_405(self):
        liberacion = Liberacion.objects.create(eclosion=self.eclosion, responsable=self.ana, fecha=self.hoy, cantidad=10)
        self.como("admin")
        respuesta = self.client.patch(f"/api/liberaciones/{liberacion.id}/", {"cantidad": 5}, format="json")
        self.assertEqual(respuesta.status_code, 405)

    def test_patch_no_baja_vivas_por_debajo_de_liberadas(self):
        Liberacion.objects.create(eclosion=self.eclosion, responsable=self.ana, fecha=self.hoy, cantidad=70)
        self.como("coordinador")
        respuesta = self.client.patch(f"/api/eclosiones/{self.eclosion.id}/", {
            "crias_vivas": 60, "huevos_sin_desarrollo": 35,
        }, format="json")
        self.assertEqual(respuesta.status_code, 400)
from datetime import datetime, time, timedelta
from django.utils import timezone
from core.pruebas_base import PruebaBase
from patrullajes.models import Asignacion


class TurnoTests(PruebaBase):
    def fecha_hora_iso(self, noche, hora):
        return timezone.make_aware(datetime.combine(noche, time(hora, 0))).isoformat()

    def test_crear_turno_responde_201(self):
        self.como("coordinador")
        noche = self.hoy + timedelta(days=2)
        respuesta = self.client.post("/api/turnos/", {
            "playa": self.playa.id, "inicio": self.fecha_hora_iso(noche, 19),
            "fin": self.fecha_hora_iso(noche, 23), "cupo_maximo": 4,
        })
        self.assertEqual(respuesta.status_code, 201)

    def test_turno_con_fin_antes_de_inicio_responde_400(self):
        self.como("coordinador")
        noche = self.hoy + timedelta(days=2)
        respuesta = self.client.post("/api/turnos/", {
            "playa": self.playa.id, "inicio": self.fecha_hora_iso(noche, 22),
            "fin": self.fecha_hora_iso(noche, 20), "cupo_maximo": 4,
        })
        self.assertEqual(respuesta.status_code, 400)
        self.assertIn("fin", respuesta.data)

    def test_asignar_voluntario_responde_201(self):
        self.como("coordinador")
        respuesta = self.client.post(f"/api/turnos/{self.turno_reciente.id}/asignar/",
                             {"voluntario": self.luis.id, "rol": "LIDER"})
        self.assertEqual(respuesta.status_code, 201)

    def test_no_asigna_voluntario_inactivo(self):
        self.como("coordinador")
        respuesta = self.client.post(f"/api/turnos/{self.turno_reciente.id}/asignar/",
                             {"voluntario": self.inactivo.id})
        self.assertEqual(respuesta.status_code, 400)

    def test_asignacion_repetida_responde_409(self):
        self.como("coordinador")
        respuesta = self.client.post(f"/api/turnos/{self.turno_antiguo.id}/asignar/",
                             {"voluntario": self.ana.id})
        self.assertEqual(respuesta.status_code, 409)

    def test_no_permite_turnos_traslapados(self):
        # Turno en otra playa a la misma hora que el turno antiguo 
        turno_que_choca = self.crear_turno(self.otra_playa, self.noche_antigua, hora=21)
        self.como("coordinador")
        respuesta = self.client.post(f"/api/turnos/{turno_que_choca.id}/asignar/", {"voluntario": self.ana.id})
        self.assertEqual(respuesta.status_code, 400)
        self.assertIn("traslapa", str(respuesta.data))

    def test_no_supera_cupo_maximo(self):
        turno = self.crear_turno(self.playa, self.hoy + timedelta(days=3), cupo=1)
        Asignacion.objects.create(turno=turno, voluntario=self.ana)
        self.como("coordinador")
        respuesta = self.client.post(f"/api/turnos/{turno.id}/asignar/", {"voluntario": self.luis.id})
        self.assertEqual(respuesta.status_code, 400)

    def test_patch_no_reduce_cupo_bajo_asignados(self):
        Asignacion.objects.create(turno=self.turno_reciente, voluntario=self.ana)
        Asignacion.objects.create(turno=self.turno_reciente, voluntario=self.luis)
        self.como("coordinador")
        respuesta = self.client.patch(f"/api/turnos/{self.turno_reciente.id}/", {"cupo_maximo": 1}, format="json")
        self.assertEqual(respuesta.status_code, 400)

    def test_filtros_combinables_y_paginacion(self):
        for numero in range(2, 14):
            self.crear_turno(self.playa, self.hoy - timedelta(days=numero * 2))
        self.como("consulta")
        respuesta = self.client.get(f"/api/turnos/?playa={self.playa.id}&page_size=5")
        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(len(respuesta.data["results"]), 5)
        self.assertIsNotNone(respuesta.data["next"])

        respuesta = self.client.get(
            f"/api/turnos/?playa={self.playa.id}&voluntario={self.ana.id}&hasta={self.hoy}"
        )
        self.assertEqual(respuesta.data["count"], 1)
from core.pruebas_base import PruebaBase


class VoluntarioTests(PruebaBase):
    def datos(self, **cambios):
        base = {
            "cedula": "205550666", "nombre": "Sofía", "apellidos": "Castro Méndez",
            "email": "sofia@correo.test", "fecha_ingreso": "2026-01-10",
        }
        base.update(cambios)
        return base

    def test_crear_voluntario_responde_201(self):
        self.como("coordinador")
        respuesta = self.client.post("/api/voluntarios/", self.datos(cedula="6-0555-0666"))
        self.assertEqual(respuesta.status_code, 201)
        self.assertEqual(respuesta.data["cedula"], "605550666")  # se normaliza sin guiones

    def test_cedula_invalida_responde_400(self):
        self.como("coordinador")
        respuesta = self.client.post("/api/voluntarios/", self.datos(cedula="12AB"))
        self.assertEqual(respuesta.status_code, 400)
        self.assertIn("cedula", respuesta.data)

    def test_email_duplicado_responde_400(self):
        self.como("coordinador")
        respuesta = self.client.post("/api/voluntarios/", self.datos(email="ana@correo.test"))
        self.assertEqual(respuesta.status_code, 400)

    def test_busqueda_por_nombre(self):
        self.como("consulta")
        respuesta = self.client.get("/api/voluntarios/?search=quesada")
        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(respuesta.data["count"], 1)
        self.assertEqual(respuesta.data["results"][0]["nombre"], "Luis")

    def test_borrar_voluntario_con_turnos_responde_409(self):
        self.como("admin")
        respuesta = self.client.delete(f"/api/voluntarios/{self.ana.id}/")
        self.assertEqual(respuesta.status_code, 409)

    def test_admin_borra_voluntario_sin_historial_204(self):
        self.como("admin")
        respuesta = self.client.delete(f"/api/voluntarios/{self.luis.id}/")
        self.assertEqual(respuesta.status_code, 204)
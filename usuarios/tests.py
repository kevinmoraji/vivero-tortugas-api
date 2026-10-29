from core.pruebas_base import PruebaBase


class AutenticacionYPermisosTests(PruebaBase):
    def test_login_correcto_devuelve_token_y_rol(self):
        respuesta = self.client.post("/api/auth/login/", {"username": "coordinador", "password": "ClavePrueba123!"})
        self.assertEqual(respuesta.status_code, 200)
        self.assertIn("token", respuesta.data)
        self.assertEqual(respuesta.data["roles"], ["Coordinador"])

    def test_login_con_clave_incorrecta_responde_401(self):
        respuesta = self.client.post("/api/auth/login/", {"username": "admin", "password": "mala"})
        self.assertEqual(respuesta.status_code, 401)

    def test_sin_token_responde_401(self):
        respuesta = self.client.get("/api/nidos/")
        self.assertEqual(respuesta.status_code, 401)

    def test_rol_consulta_no_puede_crear_responde_403(self):
        self.como("consulta")
        respuesta = self.client.post("/api/voluntarios/", {
            "cedula": "605550666", "nombre": "Sofía", "apellidos": "Castro",
            "email": "sofia@correo.test", "fecha_ingreso": "2026-01-10",
        })
        self.assertEqual(respuesta.status_code, 403)

    def test_coordinador_no_puede_borrar_responde_403(self):
        self.como("coordinador")
        respuesta = self.client.delete(f"/api/voluntarios/{self.luis.id}/")
        self.assertEqual(respuesta.status_code, 403)

    def test_rol_consulta_si_puede_leer(self):
        self.como("consulta")
        respuesta = self.client.get("/api/nidos/")
        self.assertEqual(respuesta.status_code, 200)

"""
Datos comunes para las pruebas automatizadas de todos los módulos.
"""
from datetime import datetime, time, timedelta

from django.contrib.auth.models import Group, User
from django.utils import timezone
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from core import roles
from nidos.models import Nido
from patrullajes.models import Asignacion, Turno
from vivero.models import Playa, Sector
from voluntarios.models import Voluntario


class PruebaBase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.tokens = {}
        for username, rol in [
            ("admin", roles.ADMINISTRADOR),
            ("coordinador", roles.COORDINADOR),
            ("consulta", roles.CONSULTA),
        ]:
            grupo, grupo_creado = Group.objects.get_or_create(name=rol)
            usuario = User.objects.create_user(username=username, password="ClavePrueba123!")
            usuario.groups.add(grupo)
            cls.tokens[username] = Token.objects.create(user=usuario).key

        cls.hoy = timezone.localdate()
        cls.playa = Playa.objects.create(nombre="Playa Ostional", provincia="Guanacaste")
        cls.otra_playa = Playa.objects.create(nombre="Playa Camaronal", provincia="Guanacaste")
        cls.sector1 = Sector.objects.create(playa=cls.playa, codigo="A-01")
        cls.sector2 = Sector.objects.create(playa=cls.playa, codigo="A-02")
        cls.sector_otra = Sector.objects.create(playa=cls.otra_playa, codigo="A-01")

        cls.ana = Voluntario.objects.create(
            cedula="601110222", nombre="Ana", apellidos="Solano",
            email="ana@correo.test", fecha_ingreso=cls.hoy - timedelta(days=200),
        )
        cls.luis = Voluntario.objects.create(
            cedula="602220333", nombre="Luis", apellidos="Quesada",
            email="luis@correo.test", fecha_ingreso=cls.hoy - timedelta(days=100),
        )
        cls.inactivo = Voluntario.objects.create(
            cedula="603330444", nombre="Pedro", apellidos="Mora",
            email="pedro@correo.test", fecha_ingreso=cls.hoy - timedelta(days=50), activo=False,
        )

        # Turno de hace 60 días para nidos que ya pueden eclosionar
        cls.noche_antigua = cls.hoy - timedelta(days=60)
        cls.turno_antiguo = cls.crear_turno(cls.playa, cls.noche_antigua)
        Asignacion.objects.create(turno=cls.turno_antiguo, voluntario=cls.ana, rol=Asignacion.LIDER)

        # Turno de anoche
        cls.anoche = cls.hoy - timedelta(days=1)
        cls.turno_reciente = cls.crear_turno(cls.playa, cls.anoche)

        cls.nido_listo = Nido.objects.create(
            codigo="OST-2026-001", especie=Nido.LORA, playa=cls.playa,
            turno=cls.turno_antiguo, sector=cls.sector1,
            fecha_siembra=cls.noche_antigua, huevos=100,
        )

    @staticmethod
    def crear_turno(playa, noche, hora=19, horas=6, cupo=3):
        inicio = timezone.make_aware(datetime.combine(noche, time(hora, 0)))
        return Turno.objects.create(
            playa=playa, inicio=inicio, fin=inicio + timedelta(hours=horas), cupo_maximo=cupo
        )

    def como(self, usuario):
        """Autentica el cliente con el token del usuario indicado."""
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.tokens[usuario]}")
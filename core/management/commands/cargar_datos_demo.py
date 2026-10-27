"""
Carga roles, usuarios de prueba y datos ficticios coherentes.

Uso:
    python manage.py cargar_datos_demo
    python manage.py cargar_datos_demo --limpiar   (borra los datos y los vuelve a crear)

La contraseña de los usuarios de prueba se toma de la variable DEMO_PASSWORD
del archivo .env (nunca se escribe en el código).
"""
import random
import unicodedata
from datetime import datetime, time, timedelta

from decouple import config
from django.contrib.auth.models import Group, User
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from core import roles
from nacimientos.models import Eclosion, Liberacion
from nidos.models import Nido
from patrullajes.models import Asignacion, Turno
from vivero.models import Playa, Sector
from voluntarios.models import Voluntario

PLAYAS = [
    ("Playa Ostional", "Guanacaste", "Santa Cruz", "OST"),
    ("Playa Camaronal", "Guanacaste", "Nandayure", "CAM"),
    ("Playa Caletas", "Puntarenas", "Puntarenas", "CAL"),
]

VOLUNTARIOS = [
    ("601110222", "Ana", "Solano Mora"),
    ("602220333", "Luis", "Quesada Rojas"),
    ("603330444", "María", "Vargas Chaves"),
    ("604440555", "José", "Jiménez Arias"),
    ("605550666", "Sofía", "Castro Méndez"),
    ("606660777", "Diego", "Rodríguez Solís"),
    ("607770888", "Valeria", "Hernández Brenes"),
    ("608880999", "Andrés", "Calderón Ulate"),
    ("609990111", "Camila", "Araya Picado"),
]

USUARIOS = [
    ("admin", roles.ADMINISTRADOR, True),
    ("coordinador", roles.COORDINADOR, False),
    ("consulta", roles.CONSULTA, False),
]


def sin_tildes(texto):
    return unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode().lower()


class Command(BaseCommand):
    help = "Crea roles, usuarios de prueba y datos ficticios del vivero."

    def add_arguments(self, parser):
        parser.add_argument("--limpiar", action="store_true", help="Borra los datos antes de cargar.")

    @transaction.atomic
    def handle(self, *args, **opciones):
        clave = config("DEMO_PASSWORD", default="")
        if not clave:
            raise CommandError("Defina DEMO_PASSWORD en el archivo .env antes de cargar los datos.")

        self.crear_roles_y_usuarios(clave)

        if opciones["limpiar"]:
            Liberacion.objects.all().delete()
            Eclosion.objects.all().delete()
            Nido.objects.all().delete()
            Asignacion.objects.all().delete()
            Turno.objects.all().delete()
            Sector.objects.all().delete()
            Playa.objects.all().delete()
            Voluntario.objects.all().delete()
        elif Playa.objects.exists():
            self.stdout.write(self.style.WARNING("Ya hay datos. Use --limpiar para recargarlos."))
            return

        random.seed(2026)
        self.cargar_datos()
        self.stdout.write(self.style.SUCCESS(
            f"Listo: {Playa.objects.count()} playas, {Sector.objects.count()} sectores, "
            f"{Voluntario.objects.count()} voluntarios, {Turno.objects.count()} turnos, "
            f"{Nido.objects.count()} nidos, {Eclosion.objects.count()} eclosiones, "
            f"{Liberacion.objects.count()} liberaciones."
        ))
        self.stdout.write("Usuarios de prueba: admin, coordinador, consulta (contraseña = DEMO_PASSWORD)")

    def crear_roles_y_usuarios(self, clave):
        for nombre in roles.TODOS:
            Group.objects.get_or_create(name=nombre)
        for username, rol, es_staff in USUARIOS:
            usuario, usuario_creado = User.objects.get_or_create(username=username)
            usuario.is_staff = es_staff
            usuario.set_password(clave)
            usuario.save()
            usuario.groups.set([Group.objects.get(name=rol)])

    def cargar_datos(self):
        hoy = timezone.localdate()
        zona_horaria = timezone.get_current_timezone()

        playas = []
        prefijos = {}
        for nombre, provincia, canton, prefijo in PLAYAS:
            playa = Playa.objects.create(nombre=nombre, provincia=provincia, canton=canton,
                                         descripcion=f"Playa de anidación en {canton}.")
            for numero_sector in range(1, 13):
                Sector.objects.create(playa=playa, codigo=f"A-{numero_sector:02d}")
            playas.append(playa)
            prefijos[playa.id] = prefijo

        voluntarios = [
            Voluntario.objects.create(
                cedula=cedula, nombre=nombre, apellidos=apellidos,
                email=f"{sin_tildes(nombre)}.{sin_tildes(apellidos.split()[0])}@correo.test",
                telefono=f"8{random.randint(1000000, 9999999)}",
                fecha_ingreso=hoy - timedelta(days=random.randint(120, 600)),
            )
            for cedula, nombre, apellidos in VOLUNTARIOS
        ]
        voluntarios[-1].activo = False  # un voluntario inactivo para probar reglas
        voluntarios[-1].save()
        activos = voluntarios[:-1]

        consecutivo = {playa.id: 0 for playa in playas}
        # Una noche de patrullaje cada 4 días durante los últimos 84 días.
        for dias_atras in range(84, 0, -4):
            noche = hoy - timedelta(days=dias_atras)
            grupo = random.sample(activos, 6)  # 2 por playa, sin repetir esa noche
            for posicion, playa in enumerate(playas):
                inicio = timezone.make_aware(datetime.combine(noche, time(19, 0)), zona_horaria)
                turno = Turno.objects.create(
                    playa=playa, inicio=inicio, fin=inicio + timedelta(hours=6), cupo_maximo=4
                )
                Asignacion.objects.create(
                    turno=turno, voluntario=grupo[posicion * 2], rol=Asignacion.LIDER
                )
                Asignacion.objects.create(turno=turno, voluntario=grupo[posicion * 2 + 1])

                if random.random() < 0.65:
                    sector = playa.sectores.exclude(nidos__estado=Nido.INCUBANDO).first()
                    if sector is None:
                        continue
                    consecutivo[playa.id] += 1
                    huevos = random.randint(70, 115)
                    nido = Nido.objects.create(
                        codigo=f"{prefijos[playa.id]}-{noche.year}-{consecutivo[playa.id]:03d}",
                        especie=random.choice([Nido.LORA, Nido.LORA, Nido.LORA, Nido.VERDE, Nido.BAULA]),
                        playa=playa, turno=turno, sector=sector,
                        fecha_siembra=noche, huevos=huevos,
                    )
                    self.cerrar_si_corresponde(nido, hoy, random.choice(activos))

    def cerrar_si_corresponde(self, nido, hoy, responsable):
        dias_para_eclosion = random.randint(48, 58)
        fecha_eclosion = nido.fecha_siembra + timedelta(days=dias_para_eclosion)
        if random.random() < 0.06:
            nido.estado = Nido.PERDIDO
            nido.observaciones = "Perdido: inundación por marea alta."
            nido.save()
            return
        if fecha_eclosion > hoy:
            return  # sigue incubando
        vivas = int(nido.huevos * random.uniform(0.55, 0.9))
        muertas = random.randint(0, 6)
        sin_desarrollo = nido.huevos - vivas - muertas
        eclosion = Eclosion.objects.create(
            nido=nido, fecha=fecha_eclosion, crias_vivas=vivas,
            crias_muertas=muertas, huevos_sin_desarrollo=sin_desarrollo,
        )
        nido.estado = Nido.ECLOSIONADO
        nido.save()
        # La mayoría se libera completa en una o dos salidas.
        if random.random() < 0.85:
            dos_salidas = random.random() >= 0.6 and fecha_eclosion < hoy
            primera_salida = vivas // 2 if dos_salidas else vivas
            Liberacion.objects.create(eclosion=eclosion, responsable=responsable,
                                      fecha=fecha_eclosion, cantidad=primera_salida)
            if primera_salida < vivas:
                Liberacion.objects.create(eclosion=eclosion, responsable=responsable,
                                          fecha=fecha_eclosion + timedelta(days=1),
                                          cantidad=vivas - primera_salida)
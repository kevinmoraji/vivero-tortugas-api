ADMINISTRADOR = "Administrador"
COORDINADOR = "Coordinador"
CONSULTA = "Consulta"

TODOS = (ADMINISTRADOR, COORDINADOR, CONSULTA)


def roles_de(usuario):
    if not usuario or not usuario.is_authenticated:
        return set()
    if usuario.is_superuser:
        return {ADMINISTRADOR}
    return set(usuario.groups.values_list("name", flat=True))
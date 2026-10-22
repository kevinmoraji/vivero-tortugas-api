from rest_framework.permissions import SAFE_METHODS, BasePermission

from core import roles


class PermisoPorRol(BasePermission):
    message = "Su rol no tiene permiso para realizar esta operación."

    def has_permission(self, request, view):
        usuario = request.user
        if not usuario or not usuario.is_authenticated:
            return False

        if request.method in SAFE_METHODS:
            permitidos = getattr(view, "roles_lectura", roles.TODOS)
        elif request.method == "DELETE":
            permitidos = getattr(view, "roles_borrado", (roles.ADMINISTRADOR,))
        else:
            permitidos = getattr(
                view, "roles_escritura", (roles.ADMINISTRADOR, roles.COORDINADOR)
            )

        return bool(roles.roles_de(usuario) & set(permitidos))
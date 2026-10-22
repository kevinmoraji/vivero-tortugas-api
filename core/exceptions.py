import logging

from django.db import IntegrityError
from django.db.models import ProtectedError
from django.http import JsonResponse
from rest_framework import status
from rest_framework.exceptions import APIException
from rest_framework.response import Response
from rest_framework.views import exception_handler

logger = logging.getLogger(__name__)


class Conflicto(APIException):
    """409: la operación choca con el estado actual de los datos."""

    status_code = status.HTTP_409_CONFLICT
    default_detail = "La operación entra en conflicto con el estado actual del recurso."
    default_code = "conflicto"


def manejador_errores(exc, context):
    respuesta = exception_handler(exc, context)
    if respuesta is not None:
        if respuesta.status_code == status.HTTP_404_NOT_FOUND:
            respuesta.data = {"detail": "Recurso no encontrado."}
        return respuesta

    if isinstance(exc, ProtectedError):
        return Response(
            {"detail": "No se puede eliminar: existen registros relacionados "
                       "que dependen de este recurso."},
            status=status.HTTP_409_CONFLICT,
        )

    if isinstance(exc, IntegrityError):
        return Response(
            {"detail": "El registro viola una restricción de integridad de la base de datos."},
            status=status.HTTP_409_CONFLICT,
        )

    logger.exception("Error no controlado en la API", exc_info=exc)
    return Response(
        {"detail": "Error interno del servidor."},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )


def vista_404(request, exception=None):
    return JsonResponse({"detail": "Recurso no encontrado."}, status=404)


def vista_500(request):
    return JsonResponse({"detail": "Error interno del servidor."}, status=500)
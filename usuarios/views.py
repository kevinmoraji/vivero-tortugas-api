
from django.contrib.auth import authenticate
from rest_framework import serializers, status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.roles import roles_de


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)


class LoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializador = LoginSerializer(data=request.data)
        serializador.is_valid(raise_exception=True)

        usuario = authenticate(
            username=serializador.validated_data["username"],
            password=serializador.validated_data["password"],
        )
        if usuario is None:
            return Response(
                {"detail": "Usuario o contraseña incorrectos."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

       
        token, token_creado = Token.objects.get_or_create(user=usuario)
        return Response(
            {
                "token": token.key,
                "usuario": usuario.username,
                "roles": sorted(roles_de(usuario)),
            }
        )


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        usuario_actual = request.user
        Token.objects.filter(user=usuario_actual).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class PerfilView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        usuario_actual = request.user
        return Response(
            {
                "id": usuario_actual.id,
                "usuario": usuario_actual.username,
                "nombre": usuario_actual.get_full_name(),
                "email": usuario_actual.email,
                "roles": sorted(roles_de(usuario_actual)),
            }
        )
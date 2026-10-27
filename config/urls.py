from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("usuarios.urls")),
    path("api/", include("vivero.urls")),
    path("api/", include("voluntarios.urls")),
    path("api/", include("patrullajes.urls")),
    path("api/", include("nidos.urls")),
    path("api/", include("nacimientos.urls")),
]

handler404 = "core.exceptions.vista_404"
handler500 = "core.exceptions.vista_500"
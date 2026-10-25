from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("voluntarios.urls")),
    path("api/auth/", include("usuarios.urls")),
]

handler404 = "core.exceptions.vista_404"
handler500 = "core.exceptions.vista_500"

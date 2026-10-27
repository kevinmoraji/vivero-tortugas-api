from django.contrib import admin

from .models import Asignacion, Turno

admin.site.register(Turno)
admin.site.register(Asignacion)
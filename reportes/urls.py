from django.urls import path

from . import views

urlpatterns = [
    path("resumen-playas/", views.ResumenPlayasView.as_view()),
    path("nidos-por-especie/", views.NidosPorEspecieView.as_view()),
    path("ranking-voluntarios/", views.RankingVoluntariosView.as_view()),
    path("proximos-a-eclosionar/", views.ProximosEclosionarView.as_view()),
    path("ocupacion-vivero/", views.OcupacionViveroView.as_view()),
    path("liberaciones-por-mes/", views.LiberacionesPorMesView.as_view()),
    path("baja-eclosion/", views.BajaEclosionView.as_view()),
]
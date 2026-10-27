from rest_framework.routers import SimpleRouter

from .views import TurnoViewSet

router = SimpleRouter()
router.register("turnos", TurnoViewSet, basename="turno")

urlpatterns = router.urls
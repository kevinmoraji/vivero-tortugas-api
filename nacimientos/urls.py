from rest_framework.routers import SimpleRouter

from .views import EclosionViewSet, LiberacionViewSet

router = SimpleRouter()
router.register("eclosiones", EclosionViewSet, basename="eclosion")
router.register("liberaciones", LiberacionViewSet, basename="liberacion")

urlpatterns = router.urls
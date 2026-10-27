from rest_framework.routers import SimpleRouter

from .views import NidoViewSet

router = SimpleRouter()
router.register("nidos", NidoViewSet, basename="nido")

urlpatterns = router.urls
from rest_framework.routers import SimpleRouter

from .views import PlayaViewSet, SectorViewSet

router = SimpleRouter()
router.register("playas", PlayaViewSet, basename="playa")
router.register("sectores", SectorViewSet, basename="sector")

urlpatterns = router.urls
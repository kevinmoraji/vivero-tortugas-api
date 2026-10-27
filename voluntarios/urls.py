from rest_framework.routers import SimpleRouter

from .views import VoluntarioViewSet

router = SimpleRouter()
router.register("voluntarios", VoluntarioViewSet, basename="voluntario")

urlpatterns = router.urls
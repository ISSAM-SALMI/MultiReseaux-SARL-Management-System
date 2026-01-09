from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EstimationRowViewSet

router = DefaultRouter()
router.register(r'', EstimationRowViewSet)

urlpatterns = [
    path('', include(router.urls)),
]

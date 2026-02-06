from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import QuoteViewSet, QuoteLineViewSet, QuoteTrackingViewSet, QuoteTrackingLineViewSet, QuoteGroupViewSet

router = DefaultRouter()
router.register(r'tracking-lines', QuoteTrackingLineViewSet)
router.register(r'trackings', QuoteTrackingViewSet)
router.register(r'lines', QuoteLineViewSet)
router.register(r'groups', QuoteGroupViewSet)
router.register(r'', QuoteViewSet)


urlpatterns = [
    path('', include(router.urls)),
]

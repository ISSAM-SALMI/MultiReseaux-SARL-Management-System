from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProjectViewSet, ProjectHRViewSet, ProjectCostViewSet, RevenueViewSet, ExpenseViewSet

router = DefaultRouter()
router.register(r'hr', ProjectHRViewSet)
router.register(r'costs', ProjectCostViewSet)
router.register(r'revenues', RevenueViewSet)
router.register(r'expenses', ExpenseViewSet)
router.register(r'', ProjectViewSet)

urlpatterns = [
    path('', include(router.urls)),
]


from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EmployeeViewSet, MaterialViewSet, MaterialCostViewSet, GeneralExpenseViewSet

router = DefaultRouter()
router.register(r'employees', EmployeeViewSet)
router.register(r'materials', MaterialViewSet)
router.register(r'material-costs', MaterialCostViewSet)
router.register(r'general-expenses', GeneralExpenseViewSet)

urlpatterns = [
    path('', include(router.urls)),
]

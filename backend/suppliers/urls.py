from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SupplierViewSet, SupplierInvoiceViewSet

router = DefaultRouter()
router.register(r'invoices', SupplierInvoiceViewSet) # Must verify order if prefix conflict
router.register(r'', SupplierViewSet)

urlpatterns = [
    path('', include(router.urls)),
]

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

@api_view(['GET'])
@permission_classes([AllowAny])
def api_root(request):
    return Response({
        'auth': '/api/auth/',
        'clients': '/api/clients/',
        'projects': '/api/projects/',
        'quotes': '/api/quotes/',
        'budget': '/api/budget/',
        'invoices': '/api/invoices/',
        'documents': '/api/documents/',
        'dashboard': '/api/dashboard/',
        'notifications': '/api/notifications/',
    })

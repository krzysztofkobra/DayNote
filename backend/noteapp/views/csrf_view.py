from django.views.decorators.csrf import ensure_csrf_cookie
from django.http import JsonResponse

@ensure_csrf_cookie
def csrf(request):
    print("csrf token")
    return JsonResponse({'detail': 'CSRF cookie set'})
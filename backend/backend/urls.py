from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse


def api_root(request):
    return JsonResponse({
        "system":  "AfyaMojav1 HMIS",
        "version": "1.0.0",
        "status":  "running",
        "docs":    "/api/",
    })


urlpatterns = [
    # Django admin
    path('admin/', admin.site.urls),

    # Health check / root
    path('', api_root, name='api-root'),

    # All API routes under /api/
    path('api/', include('core.urls')),
]

# ── Custom Admin Site Branding ────────────────
admin.site.site_header  = "AfyaMojav1 Administration"
admin.site.site_title   = "AfyaMoja Admin"
admin.site.index_title  = "Hospital Management Dashboard"
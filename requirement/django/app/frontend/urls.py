from django.urls import path
from . import views

from django.conf import settings
from django.conf.urls.static import static

app_name = "frontend"

urlpatterns = [
    path('', views.index, name="index"),
    path('dashboard/', views.dashboard, name="dashboard"),
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
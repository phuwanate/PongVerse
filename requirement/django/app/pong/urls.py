from django.urls import path
from . import views

app_name = "pong"

urlpatterns = [
    # path("", views.index, name="index"),
    # path("waitmatch/", views.waitmatch, name="waitmatch"),
    path("players/<int:user_id>/match_history", views.match_history, name="match_history"),
    path("players/<int:user_id>/statictis", views.statictis, name="statistic")
]
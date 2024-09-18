from django.urls import path
from channels.routing import URLRouter
from chat import routing as chat_routing
from pong import routing as pong_routing

websocket_urlpatterns = [
    path("ws/chatroom/", URLRouter(chat_routing.websocket_urlpatterns)),
    path("ws/pong/", URLRouter(pong_routing.websocket_urlpatterns))
]

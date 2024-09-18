from django.urls import path
from .consumers import *

websocket_urlpatterns = [
    path("private/<chatroom_name>", ChatroomConsumer.as_asgi()),
    path("public_chat", ChatPublicComsumer.as_asgi())
]


from django.urls import path
from .consumers.pong_consumer import PongConsumer
# from .consumers.private_consumer import PrivateConsumer
from .consumers.public_consumer import PublicConsumer

websocket_urlpatterns = [
    # path("ponggame/<player1>/<player2>", PongConsumer.as_asgi()),
    # path("private/<player1>/<player2>", PrivateConsumer.as_asgi())
    path("public", PublicConsumer.as_asgi())
]
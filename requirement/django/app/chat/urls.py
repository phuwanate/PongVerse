from django.urls import path
from .views import *

urlpatterns = [
    # path('', chat_view, name="home"),
    # expect friend name for find chatroom_name
    path('get/<username>', get_or_create_chatroom, name="start-chat"),
    path('private/<chatroom_name>', private_chat_messages, name="private-chat")
    # path('chat/room/<chatroom_name>', chat_view, name="chatroom"),
]
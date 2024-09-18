# from django.shortcuts import render
from django.http import JsonResponse
from django.core import serializers
from django.contrib.auth import get_user_model
from .models import *
import sys
from backend.views import jwt_manual_validate
from django.conf import settings

# Create your views here.
def private_chat_messages(request, chatroom_name):
  if request.user.is_authenticated:
    if settings.ALLOW_API_WITHOUT_JWT == False:
        err = jwt_manual_validate(request)
        if err is not None:
            return JsonResponse(err, status=401)
    chat_group = ChatGroup.objects.get(group_name=chatroom_name)
    if chat_group is None:
      return JsonResponse({'error': 'Chatroom not found'}, status=404)
    if not chat_group.is_private:
      return JsonResponse({'error': 'Chatroom is not private'}, status=400)
    chat_messages = chat_group.chat_messages.all()[:30][::-1]
    data = serializers.serialize('json', chat_messages)
    return JsonResponse(data, safe=False,  status=200)
  else:
      return JsonResponse({'error': 'User is not logged in'}, status=401)


# return room_name as json
# {chatroom: <room_name>}
def get_or_create_chatroom(request, username):
  if request.user.is_authenticated:
    if settings.ALLOW_API_WITHOUT_JWT == False:
        err = jwt_manual_validate(request)
        if err is not None:
            return JsonResponse(err, status=401)
    if request.user.username == username:
      return JsonResponse({'error': 'User can not self friend'}, status=401)
    
    User = get_user_model()
    other_user = User.objects.get(username=username)
    if not other_user:
      return JsonResponse({'error': 'username not found'}, status=404)

    chatroom = None
    my_chatrooms = request.user.chat_groups.filter(is_private=True)
    if my_chatrooms.exists():
      for chat in my_chatrooms:
          if other_user in chat.members.all():
              chatroom = chat
              break
    if not chatroom:
        chatroom = ChatGroup.objects.create(is_private=True)
        chatroom.members.add(other_user, request.user)

    return JsonResponse({'chatroom': chatroom.group_name}, status=200)
  else:
      return JsonResponse({'error': 'User is not logged in'}, status=401)
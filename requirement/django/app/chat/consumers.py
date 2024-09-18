from channels.generic.websocket import WebsocketConsumer
from .models import *
from django.shortcuts import get_object_or_404
# from django.template.loader import render_to_string
from asgiref.sync import async_to_sync
import json
import sys
from django.core import serializers

RED = "\033[91m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
RESET = "\033[0m"

class ChatroomConsumer(WebsocketConsumer):

	user_online: dict[str, list[str]] = {}

	def connect(self):
		self.user: User = self.scope['user']
		self.chatroom_name = self.scope['url_route']['kwargs']['chatroom_name']
		self.chatroom = get_object_or_404(ChatGroup, group_name=self.chatroom_name)
		async_to_sync(self.channel_layer.group_add)(
			self.chatroom_name, self.channel_name
		)
		# #add and update online users
		if self.chatroom_name not in self.user_online:
			self.user_online[self.chatroom_name] = []
		self.user_online[self.chatroom_name].append(self.user.username)
		self.update_online_count()

		self.accept()
		self.send(text_data=json.dumps({"online_count": "hello form server"}))

	def disconnect(self, close_code):
		self.user: User = self.scope['user']
		self.chatroom_name = self.scope['url_route']['kwargs']['chatroom_name']

		async_to_sync(self.channel_layer.group_discard)(
			self.chatroom_name, self.channel_name
		)

		# remove and update online users
		self.user_online[self.chatroom_name].remove(self.user.username)
		self.update_online_count()

	def receive(self, text_data):
		text_data_json = json.loads(text_data)
		type = text_data_json['type']
		event = {}
		if type == "message":	
			body = text_data_json['body']
			message = GroupMessage.objects.create(
				body = body,
				author = self.user,
				group = self.chatroom
			)
			event['message_id'] = message.id
			event['type'] = 'message_handler'
			
		async_to_sync(self.channel_layer.group_send)(
			self.chatroom_name, event
		)

	def message_handler(self, event):
		message_id = event['message_id']
		message = GroupMessage.objects.get(id=message_id)
		context = {
			'type': 'message_handler',
			'message': {
				'id': message.id,
				'body': message.body,
				'author': message.author.id,
			},
			'user': {
				'id': self.user.id,
				'username': self.user.username,
			},
		}
		self.send(text_data=json.dumps(context))

	def update_online_count(self):
		online_count = len(set(self.user_online[self.chatroom_name])) - 1
		event = {
			'type': 'online_count_handler',
			'online_count': online_count
		}
		async_to_sync(self.channel_layer.group_send)(self.chatroom_name, event)

	def online_count_handler(self, event):
		self.send(text_data=json.dumps(event))


class ChatPublicComsumer(WebsocketConsumer):

	public_chat = "public_chat"
	def connect(self):
		async_to_sync(self.channel_layer.group_add)(
			self.public_chat, self.channel_name
		)
		self.accept()

	def disconnect(self, close_code):
		async_to_sync(self.channel_layer.group_discard)(
			self.public_chat, self.channel_name
		)

	def receive(self, text_data):
		text_data_json = json.loads(text_data)
		event = {
			"type": "send_public",
			"data": text_data_json
		}
		async_to_sync(self.channel_layer.group_send)(
			self.public_chat, event
		)

	def send_public(self, event):
		self.send(text_data=json.dumps(event["data"]))

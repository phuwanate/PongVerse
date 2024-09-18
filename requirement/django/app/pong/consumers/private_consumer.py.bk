from channels.generic.websocket import AsyncWebsocketConsumer
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from channels.db import database_sync_to_async
from collections import defaultdict
import json

User = get_user_model()

#this consumer will control private game
#keep button status wait or ready
#when both players ready bring players to pong game
class Player():
	def __init__(self):
		self.name = None
		self.status = False
		self.atatar = False

	def set_name(self, name):
		self.name = name

	def set_status(self, status):
		self.status = status
	
	def set_avatar(self, avatar):
		self.atatar = avatar

class Private_data():
	def __init__(self):
		self.inviter = Player()
		self.invited = Player()

	def to_dict(self):
		return {
			"inviter": self.inviter.name,
			"invited": self.invited.name,
			"inviter_status": self.inviter.status,
			"invited_status": self.invited.status,
			"inviter_avatar": self.inviter.atatar,
			"invited_avatar": self.invited.atatar,
		}

class PrivateConsumer(AsyncWebsocketConsumer):

	private_datas = {}
	active_connection = defaultdict(int)

	async def connect(self):
		self.user = self.scope['user']
		self.player_1 = self.scope['url_route']['kwargs']['player1']
		self.player_2 = self.scope['url_route']['kwargs']['player2']

		# check player is user in database
		self.user_1 = await self.get_user(self.player_1)
		self.user_2 = await self.get_user(self.player_2)

		self.chatroom_name = f"private_pong_{self.player_1}_{self.player_2}"

		# if self.active_connection[self.chatroom_name] == 2:
		# 	return
		
		await self.accept()
		await self.channel_layer.group_add(self.chatroom_name, self.channel_name)
		self.active_connection[self.chatroom_name] += 1

		if self.chatroom_name not in self.private_datas:
			self.data = Private_data()
			self.data.inviter.set_name(self.player_1)
			self.data.invited.set_name(self.player_2)
			self.data.inviter.set_avatar(self.user_1.avatar.url)
			self.data.invited.set_avatar(self.user_2.avatar.url)
			self.private_datas[self.chatroom_name] = self.data
		
		self.data = self.private_datas[self.chatroom_name]
		await self.channel_layer.group_send(
			self.chatroom_name,
			{
				'type': 'private_data',
				'data': self.data.to_dict()
			}
		)
		
	async def disconnect(self, close_code):
		await self.channel_layer.group_discard(self.chatroom_name, self.channel_name)
		self.active_connection[self.chatroom_name] -= 1

		# if player leave room should send message to another player to close socket
		await self.channel_layer.group_send(
			self.chatroom_name,
			{
				'type': 'game_end',
			}
		)

		if not self.active_connection[self.chatroom_name]:
			del self.private_datas[self.chatroom_name]

	async def private_data(self, event):
		await self.send(text_data=json.dumps(event))

	async def game_end(self, event):
		await self.send(text_data=json.dumps(event))

	@database_sync_to_async
	def get_user(self, username):
		return get_object_or_404(User, username=username)

